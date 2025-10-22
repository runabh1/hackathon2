// src/app/api/auth/google/callback/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET,
      process.env.GCP_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // IMPORTANT: In a real app, you need to get the currently logged-in
    // Firebase user's UID to associate the tokens with them.
    // This example simulates getting it. You would typically pass a session cookie
    // or an ID token from the client to verify the user.
    // For this example, we'll assume a hardcoded user or one passed via state.
    // **THIS IS A CRITICAL SECURITY STEP IN A REAL APP**
    const referer = headers().get('referer');
    const redirectUrl = referer ? new URL(referer).origin : '/';
    
    // In a real app, you'd get the UID from a verified session.
    // Here we'll just redirect. The client will need to handle the login state.
    // A more robust solution involves custom Firebase auth tokens.
    
    if (tokens.refresh_token) {
        // You would get the UID from a session. For now, we cannot save it securely.
        // This part needs to be connected to your user session management.
        console.log("Received refresh token. In a real app, save this to Firestore against the user's UID.");
        console.log("Access Token:", tokens.access_token);
        console.log("Refresh Token:", tokens.refresh_token);

        // Store tokens securely in Firestore (example placeholder)
        // const userId = 'some-verified-user-id';
        // await getFirestore()
        //     .collection('users').doc(userId)
        //     .collection('integrations').doc('gmail')
        //     .set({
        //         accessToken: tokens.access_token,
        //         refreshToken: tokens.refresh_token,
        //         expiresAt: Date.now() + (tokens.expiry_date! - Date.now()),
        //     }, { merge: true });

    }


    // Redirect user back to the dashboard
    return NextResponse.redirect(`${redirectUrl}/dashboard`);

  } catch (error: any) {
    console.error('Error exchanging authorization code:', error.message);
    return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 500 });
  }
}
