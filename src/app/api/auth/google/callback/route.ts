// src/app/api/auth/google/callback/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { cookies } from 'next/headers';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error in Callback:', error);
    // Return a generic error response
    return new NextResponse(
        JSON.stringify({ error: 'Internal Server Error: Could not initialize Firebase Admin.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, host, protocol } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The state should contain the userId

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json({ error: 'Missing state parameter containing userId' }, { status: 400 });
  }
  
  const userId = state; // The user ID is passed in the state

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET,
      `${protocol}//${host}/api/auth/google/callback` // Use dynamic redirect URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (tokens.refresh_token && tokens.access_token && tokens.expiry_date) {
        // Securely store the tokens in Firestore, associated with the user's UID.
        await getFirestore()
            .collection('users').doc(userId)
            .collection('integrations').doc('gmail')
            .set({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expiry_date,
            }, { merge: true });
    } else if (tokens.access_token) {
        // Handle cases where a refresh token isn't provided (e.g., re-authentication)
        await getFirestore()
        .collection('users').doc(userId)
        .collection('integrations').doc('gmail')
        .set({
            accessToken: tokens.access_token,
            expiresAt: tokens.expiry_date,
        }, { merge: true });
    } else {
        throw new Error('Failed to retrieve necessary tokens from Google.');
    }
    
    // Redirect user back to the dashboard.
    const redirectUrl = `${protocol}//${host}/dashboard?gmail_linked=true`;
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error exchanging authorization code:', error.message);
    const redirectUrl = `${protocol}//${host}/dashboard?error=auth_failed`;
    return NextResponse.redirect(redirectUrl);
  }
}
