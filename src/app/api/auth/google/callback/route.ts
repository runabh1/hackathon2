// src/app/api/auth/google/callback/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { cookies } from 'next/headers';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    const serviceAccount = JSON.parse(serviceAccountString);
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
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The state should contain the userId

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json({ error: 'Missing state parameter containing userId' }, { status: 400 });
  }
  
  const userId = state; // The user ID is passed in the state
  
  // Use a hardcoded localhost redirect URI for local development
  const redirectURI = 'http://localhost:9002/api/auth/google/callback';

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET,
      redirectURI
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
    
    // Create a simple HTML page that closes the tab
    const html = `
      <html>
        <head>
          <script>
            window.close();
          </script>
        </head>
        <body>
          <p>Authentication successful! You can now close this tab.</p>
        </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: any) {
    console.error('Error exchanging authorization code:', error.message);
    const html = `
      <html>
        <body>
          <h2>Authentication Failed</h2>
          <p>Something went wrong. Please close this tab and try again.</p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `;
     return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
