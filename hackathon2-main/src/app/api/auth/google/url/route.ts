// src/app/api/auth/google/url/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // This URI MUST EXACTLY match one of the "Authorized redirect URIs" in your Google Cloud Console
  const redirectURI = process.env.GCP_REDIRECT_URI;

  if (!redirectURI) {
    console.error("GCP_REDIRECT_URI is not set in environment variables.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GCP_CLIENT_ID,
    process.env.GCP_CLIENT_SECRET,
    redirectURI
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Important to get a refresh token
    scope: scopes,
    prompt: 'consent', // Ensures the user sees the consent screen to get a refresh token every time
    state: userId, // Pass the userId in the state parameter to link the auth flow to the user
  });

  return NextResponse.json({ url });
}
