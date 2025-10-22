// src/app/api/auth/google/url/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // Use a hardcoded localhost redirect URI for local development
  const redirectURI = 'http://localhost:9002/api/auth/google/callback';

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
    prompt: 'consent', // Ensures the user sees the consent screen every time
    state: userId, // Pass the userId in the state parameter
  });

  return NextResponse.json({ url });
}
