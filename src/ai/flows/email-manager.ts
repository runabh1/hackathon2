'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/firebase/tokenService';

// This Genkit tool is now a pure server-side tool that relies on the tokenService
// to get a valid token and then interacts with the Gmail API.

export const emailManagerTool = ai.defineTool(
    {
        name: 'emailManagerTool',
        description: 'Retrieves and summarizes the latest unread emails for a user. It will handle authentication automatically.',
        inputSchema: z.object({
            userId: z.string().describe('The authenticated Firebase User ID of the student.'),
        }),
        outputSchema: z.string(),
    },
    async ({ userId }) => {
        try {
            // 1. Get a valid access token (handles refresh automatically)
            const accessToken = await getValidAccessToken(userId);

            // 2. Set up the Gmail API client
            const gmail = google.gmail({ version: 'v1' });
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            
            google.options({ auth: oauth2Client });

            // 3. Fetch unread messages
            const res = await gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: 5, // Limit to 5 for a concise summary
            });

            const messages = res.data.messages || [];
            if (messages.length === 0) {
                return "No unread emails found.";
            }

            // 4. Fetch details for each message
            const emailPromises = messages.map(async (message) => {
                if (!message.id) return null;
                const msg = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From'],
                });
                const subject = msg.data.payload?.headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
                const from = msg.data.payload?.headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
                return `From: ${from}\nSubject: ${subject}\nSnippet: ${msg.data.snippet || ''}`;
            });

            const emailDetails = (await Promise.all(emailPromises)).filter(Boolean);
            
            if (emailDetails.length === 0) {
                return "Could not retrieve details for unread emails.";
            }

            // 5. Format the output for the LLM
            return `Here is a summary of your unread emails:\n\n${emailDetails.join('\n---\n')}`;

        } catch (error: any) {
            console.error('Error in emailManagerTool:', error);
            // Return a user-friendly error message to the LLM
            return `Error: ${error.message || 'Could not retrieve emails. Please ensure your account is linked and permissions are granted.'}`;
        }
    }
);
