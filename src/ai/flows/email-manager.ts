'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import {doc, getDoc} from "firebase/firestore";
import { useFirestore } from '@/firebase';

// Helper to get tokens from Firestore
async function getTokensFromFirestore(userId: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    // This is a client-side function now, it should not use firebase-admin
    // This function will need to be called from a component that has access to firestore instance
    // For a tool, it's better to fetch this from a secure backend endpoint,
    // but for simplicity of this single file, let's assume this tool is run in an environment
    // that can be configured with the user's firestore instance.
    // The current implementation is problematic because a server-side tool can't use client-side hooks.
    // Let's refactor to use Firebase Admin SDK, but it must be initialized properly.
    
    if (!getApps().length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        initializeApp({
            credential: cert(serviceAccount),
        });
    }
    const db = getFirestore();

    const docRef = db.collection('users').doc(userId).collection('integrations').doc('gmail');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.log('No token document found for user:', userId);
        return null;
    }
    const data = docSnap.data();
    if (!data || !data.refreshToken) {
        console.log('Refresh token missing for user:', userId);
        return null;
    }

    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
    };
}

// Helper to refresh Google Access Token
async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GCP_CLIENT_ID,
        process.env.GCP_CLIENT_SECRET,
        process.env.GCP_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token!;
}

// The Genkit Tool
export const emailManagerTool = ai.defineTool(
    {
        name: 'emailManagerTool',
        description: 'Retrieves and summarizes the latest unread emails for the student.',
        inputSchema: z.object({
            userId: z.string().describe('The authenticated Firebase User ID of the student.'),
        }),
        outputSchema: z.string(), // Returns a text summary for the LLM to use
    },
    async ({ userId }) => {
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
