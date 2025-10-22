'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';


// This helper should only be run on the server (like in a Genkit flow)
async function getTokensFromFirestore(userId: string): Promise<{ refreshToken: string } | null> {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'users', userId, 'integrations', 'gmail');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || !docSnap.data()?.refreshToken) {
        console.log('Refresh token not found for user:', userId);
        return null;
    }
    return { refreshToken: docSnap.data()!.refreshToken };
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GCP_CLIENT_ID,
            process.env.GCP_CLIENT_SECRET,
            // Use the same hardcoded redirect URI
            'http://localhost:9002/api/auth/google/callback'
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (!credentials.access_token) {
            throw new Error("Failed to refresh access token.");
        }
        return credentials.access_token;
    } catch (error) {
        console.error("Error refreshing Google access token:", error);
        throw new Error("Could not refresh Google access token. The user may need to re-authenticate.");
    }
}


export const emailManagerTool = ai.defineTool(
    {
        name: 'emailManagerTool',
        description: 'Manages Gmail integration. It can exchange an authorization code for tokens and store them, or retrieve and summarize the latest unread emails for a user.',
        inputSchema: z.object({
            userId: z.string().describe('The authenticated Firebase User ID of the student.'),
            authCode: z.string().optional().describe('An authorization code from Google OAuth flow. If provided, the tool will exchange it for tokens and store them.'),
        }),
        outputSchema: z.string(),
    },
    async ({ userId, authCode }) => {
        // SCENARIO 1: Exchange authorization code for tokens
        if (authCode) {
            try {
                 const oauth2Client = new google.auth.OAuth2(
                    process.env.GCP_CLIENT_ID,
                    process.env.GCP_CLIENT_SECRET,
                    'http://localhost:9002/api/auth/google/callback'
                );
                const { tokens } = await oauth2Client.getToken(authCode);

                if (tokens.refresh_token && tokens.access_token && tokens.expiry_date) {
                    const { firestore } = initializeFirebase();
                    await setDoc(doc(firestore, 'users', userId, 'integrations', 'gmail'), {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        expiresAt: tokens.expiry_date,
                    }, { merge: true });
                    return "Successfully linked Gmail account.";
                } else {
                     throw new Error('Failed to retrieve the necessary tokens from Google.');
                }
            } catch (error: any) {
                console.error('Error exchanging authorization code:', error);
                return `Error: Failed to link Gmail account. ${error.message}`;
            }
        }

        // SCENARIO 2: Fetch and summarize emails
        const tokens = await getTokensFromFirestore(userId);
        if (!tokens) {
            return "Error: Gmail account not linked. The user needs to link their account first.";
        }

        try {
            const accessToken = await refreshGoogleAccessToken(tokens.refreshToken);

            const gmail = google.gmail({ version: 'v1' });
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            
            google.options({ auth: oauth2Client });

            const res = await gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: 5,
            });

            const messages = res.data.messages || [];
            if (messages.length === 0) {
                return "No unread emails found.";
            }

            const emailPromises = messages.map(async (message) => {
                const msg = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id!,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From'],
                });
                const subject = msg.data.payload?.headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
                const from = msg.data.payload?.headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
                return `From: ${from}\nSubject: ${subject}\nSnippet: ${msg.data.snippet}\n---`;
            });

            const emailDetails = await Promise.all(emailPromises);
            return `Unread Email Summary:\n${emailDetails.join('\n')}`;

        } catch (error: any) {
            console.error('Error fetching emails:', error);
            if (error.response?.data?.error === 'invalid_grant') {
                 return "Error: Gmail token is invalid or has been revoked. Please re-link your account.";
            }
            return 'Error: Could not retrieve emails. There might be an issue with the connection.';
        }
    }
);
