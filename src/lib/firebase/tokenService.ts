// src/lib/firebase/tokenService.ts
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// This file contains SERVER-SIDE logic only. It uses the Firebase Admin SDK.

let db: Firestore;

function initializeAdminApp() {
    if (!getApps().length) {
        let serviceAccount: ServiceAccount;
        try {
            if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
            }
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e);
            throw new Error("Firebase Admin SDK initialization failed.");
        }
        initializeApp({
            credential: cert(serviceAccount),
        });
    }
    db = getFirestore();
}

export function getAdminDb() {
  if (!db) {
    initializeAdminApp();
  }
  return db;
}


/**
 * Saves the user's OAuth tokens to Firestore using the Admin SDK.
 * @param userId - The Firebase UID of the user.
 * @param tokens - The tokens object from Google OAuth2.
 */
export async function saveUserTokens(userId: string, tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
    scope?: string | null;
}) {
  const firestore = getAdminDb();
  if (!userId) throw new Error("User ID is required to save tokens.");
  if (!tokens.refresh_token) throw new Error("A refresh token is required.");

  const integrationRef = firestore.collection('users').doc(userId).collection('integrations').doc('gmail');
  
  await integrationRef.set({
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    expiresAt: tokens.expiry_date,
    scope: tokens.scope,
  }, { merge: true });
}

/**
 * Retrieves a valid access token for the user, refreshing it if necessary.
 * @param userId - The Firebase UID of the user.
 * @returns A valid access token.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const firestore = getAdminDb();
  if (!userId) throw new Error("User ID is required to get an access token.");

  const integrationRef = firestore.collection('users').doc(userId).collection('integrations').doc('gmail');
  const doc = await integrationRef.get();

  if (!doc.exists) {
    throw new Error("Gmail integration not found for this user. Please link your account.");
  }

  const data = doc.data();
  const refreshToken = data?.refreshToken;
  const expiresAt = data?.expiresAt;

  if (!refreshToken) {
    throw new Error("Refresh token not found. Please re-link your Gmail account.");
  }

  // If the token is not expired (with a 60-second buffer), return the current one.
  if (expiresAt && Date.now() < expiresAt - 60000 && data.accessToken) {
    return data.accessToken;
  }

  // If the token is expired, use the refresh token to get a new one.
  const oauth2Client: OAuth2Client = new google.auth.OAuth2(
    process.env.GCP_CLIENT_ID,
    process.env.GCP_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const { access_token, expiry_date } = credentials;

    if (!access_token) {
      throw new Error("Failed to refresh access token.");
    }
    
    // Save the new token and expiry date to Firestore
    await integrationRef.update({
      accessToken: access_token,
      expiresAt: expiry_date,
    });
    
    return access_token;

  } catch (error: any) {
    console.error("Error refreshing access token:", error.response?.data || error.message);
    // This could happen if the user revoked access.
    throw new Error("Could not refresh the access token. Please try re-linking your Gmail account.");
  }
}
