// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { saveUserTokens } from '@/lib/firebase/tokenService.server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state'); // The user ID is passed in the state

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/dashboard?error=auth_failed', req.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_CLIENT_ID,
      process.env.GCP_CLIENT_SECRET,
      process.env.GCP_REDIRECT_URI // Use environment variable
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
        // This can happen if the user has already granted consent and a refresh token wasn't requested again.
        // Or if the access_type wasn't 'offline'. For this app, we'll treat it as an error.
        throw new Error("A refresh token is required for offline access. Please ensure you are consenting to offline access.");
    }
    
    // Securely save the tokens on the server side using the new service
    await saveUserTokens(userId, tokens);

    // Redirect to a success page that can be closed
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Success!</h1>
            <p>Your Gmail account has been linked. You can now close this tab.</p>
          </div>
          <script>
            window.close();
          </script>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );

  } catch (error: any) {
    console.error('Error during token exchange:', error);
    // Redirect to an error page
    const errorMessage = error.message || 'An unknown error occurred during authentication.';
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(errorMessage)}`, req.url));
  }
}
