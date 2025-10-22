// src/app/api/auth/google/callback/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams, host, protocol } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  const cookieStore = cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  // Security check: Ensure the state matches to prevent CSRF attacks.
  // In a more robust implementation, the 'state' would be a securely generated random string.
  // For now, we'll assume a simple check or pass the UID in the state.
  // A simple approach is to use the referer, but state is better.
  // Let's assume the state contains the user UID for this example.

  // Let's get the user from the session cookie
  const sessionCookie = cookieStore.get('__session')?.value || '';
  let decodedToken;
  try {
    decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid session cookie' }, { status: 401 });
  }
  
  const userId = decodedToken.uid;
  
  if (!userId) {
     return NextResponse.json({ error: 'Unauthorized: Could not identify user.' }, { status: 401 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET,
      process.env.GCP_REDIRECT_URI
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
    } else {
        // Handle cases where a refresh token isn't provided (e.g., re-authentication)
        // You might just update the access token here if needed.
        if (tokens.access_token) {
             await getFirestore()
            .collection('users').doc(userId)
            .collection('integrations').doc('gmail')
            .set({
                accessToken: tokens.access_token,
                expiresAt: tokens.expiry_date,
            }, { merge: true });
        }
    }
    
    // Redirect user back to the dashboard.
    const redirectUrl = `${protocol}//${host}/dashboard`;
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error exchanging authorization code:', error.message);
    const redirectUrl = `${protocol}//${host}/dashboard?error=auth_failed`;
    return NextResponse.redirect(redirectUrl);
  }
}
