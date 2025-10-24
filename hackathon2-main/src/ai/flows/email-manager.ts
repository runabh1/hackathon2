'use server';
/**
 * @fileOverview A set of tools for interacting with the Gmail API.
 * This file provides tools for listing emails and reading their content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserRefreshToken } from '@/lib/firebase/tokenService.server';
import type { gmail_v1 } from 'googleapis';

/**
 * Creates an OAuth2 client with the user's credentials.
 * @param userId - The Firebase UID of the user.
 * @returns A configured OAuth2Client.
 */
async function getOauth2Client(userId: string) {
  if (!userId) {
    throw new Error('User ID is missing. Cannot access emails without it.');
  }

  // Check environment variables
  if (!process.env.GCP_CLIENT_ID || !process.env.GCP_CLIENT_SECRET || !process.env.GCP_REDIRECT_URI) {
    throw new Error('Google OAuth environment variables are not configured. Please check GCP_CLIENT_ID, GCP_CLIENT_SECRET, and GCP_REDIRECT_URI.');
  }

  const { google } = await import('googleapis');

  try {
    const refreshToken = await getUserRefreshToken(userId);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET,
      process.env.GCP_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // The googleapis library handles token refreshing automatically.
    const { token: accessToken } = await oauth2Client.getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to refresh the access token.');
    }
    oauth2Client.setCredentials({ access_token: accessToken });

    return oauth2Client;
  } catch (error: any) {
    console.error('Error in getOauth2Client:', error);
    if (error.message?.includes('integration not found')) {
      throw new Error("Gmail account is not linked. Please link your Gmail account from the dashboard first.");
    }
    throw new Error(`Failed to initialize Gmail client: ${error.message}`);
  }
}


// --- List Emails Tool ---
export const listEmailsTool = ai.defineTool(
  {
    name: 'listEmails',
    description: 'Lists emails from the user\'s Gmail account based on criteria. Use this to find emails before reading them.',
    inputSchema: z.object({
      userId: z.string().describe('The authenticated Firebase User ID of the student.'),
      query: z.string().optional().describe('A standard Gmail search query (e.g., "is:unread from:professor@school.edu"). Defaults to "is:unread".'),
      maxResults: z.number().optional().default(10).describe('The maximum number of emails to return.'),
    }),
    outputSchema: z.array(
        z.object({
            id: z.string(),
            threadId: z.string(),
            subject: z.string(),
            from: z.string(),
            snippet: z.string(),
        })
    ),
  },
  async ({ userId, query = 'is:unread', maxResults = 10 }) => {
    try {
      const { google } = await import('googleapis');
      const oauth2Client = await getOauth2Client(userId);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = res.data.messages || [];
      if (messages.length === 0) {
        return [];
      }

      const emailPromises = messages.map(async (message) => {
        if (!message.id || !message.threadId) return null;
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From'],
        });
        const subject = msg.data.payload?.headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = msg.data.payload?.headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
        return {
          id: message.id,
          threadId: message.threadId,
          subject,
          from,
          snippet: msg.data.snippet || '',
        };
      });

      return (await Promise.all(emailPromises)).filter(Boolean) as any;

    } catch (error: any) {
        console.error('Error in listEmailsTool:', error);
        if (error.message.includes("integration not found")) {
            throw new Error("It looks like the Gmail account isn't linked. Please ask the user to link their account from the dashboard to use this feature.");
        }
        throw new Error(`Could not retrieve emails. Please ensure the account is linked and permissions are granted. Error: ${error.message}`);
    }
  }
);


// --- Read Email Tool ---
export const readEmailTool = ai.defineTool(
    {
        name: 'readEmail',
        description: 'Reads the full content of a specific email by its ID.',
        inputSchema: z.object({
            userId: z.string().describe('The authenticated Firebase User ID of the student.'),
            emailId: z.string().describe('The ID of the email to read.'),
        }),
        outputSchema: z.object({
            id: z.string(),
            subject: z.string(),
            from: z.string(),
            date: z.string(),
            body: z.string().describe('The full, plain-text body of the email.'),
        }),
    },
    async ({ userId, emailId }) => {
        try {
            const { google } = await import('googleapis');
            const oauth2Client = await getOauth2Client(userId);
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const email = await gmail.users.messages.get({
                userId: 'me',
                id: emailId,
                format: 'full'
            });
            
            const headers = email.data.payload?.headers || [];
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers.find(h => h.name === 'Date')?.value || '';

            let body = '';
            const payload = email.data.payload;

            // Recursively find the plain text part of the email
            function findPlainTextPart(parts: gmail_v1.Schema$MessagePart[]): gmail_v1.Schema$MessagePart | null {
                let textPart = null;
                for (const part of parts) {
                    if (part.mimeType === 'text/plain') {
                        textPart = part;
                        break;
                    }
                    if (part.mimeType?.startsWith('multipart/')) {
                        textPart = findPlainTextPart(part.parts || []);
                        if (textPart) break;
                    }
                }
                return textPart;
            }

            if (payload?.mimeType === 'text/plain') {
                 if(payload.body?.data) {
                    body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
                 }
            } else if (payload?.parts) {
                const textPart = findPlainTextPart(payload.parts);
                if (textPart && textPart.body?.data) {
                    body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                }
            }
            // Fallback for simple body structure
            else if (payload?.body?.data) {
                 body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            }


            return {
                id: email.data.id || emailId,
                subject,
                from,
                date,
                body: body.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, ' ').trim(), // Clean up whitespace
            };

        } catch (error: any) {
            console.error(`Error in readEmailTool for emailId ${emailId}:`, error);
            if (error.message.includes("integration not found")) {
                throw new Error("It looks like the Gmail account isn't linked. Please ask the user to link their account from the dashboard to use this feature.");
            }
            throw new Error(`Failed to read email. Error: ${error.message}`);
        }
    }
);
