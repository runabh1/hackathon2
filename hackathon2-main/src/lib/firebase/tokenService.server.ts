// src/lib/firebase/tokenService.server.ts
import 'server-only';
import { getAdminDb } from './admin';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { Firestore } from 'firebase-admin/firestore';

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
  const firestore: Firestore = getAdminDb();
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
 * Retrieves the stored refresh token for a user.
 * @param userId - The Firebase UID of the user.
 * @returns The user's refresh token.
 */
export async function getUserRefreshToken(userId: string): Promise<string> {
  const firestore: Firestore = getAdminDb();
  if (!userId) throw new Error("User ID is required to get a refresh token.");

  const integrationRef = firestore.collection('users').doc(userId).collection('integrations').doc('gmail');
  const docSnap = await integrationRef.get();

  if (!docSnap.exists) {
    throw new Error("Gmail integration not found for this user. Please link your account.");
  }

  const data = docSnap.data();
  const refreshToken = data?.refreshToken;

  if (!refreshToken) {
    throw new Error("Refresh token not found. Please re-link your Gmail account.");
  }
  
  return refreshToken;
}
