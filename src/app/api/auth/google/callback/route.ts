// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The state should contain the userId

  if (!code || !state) {
    // Or redirect to an error page
    return NextResponse.redirect(new URL('/dashboard?error=auth_failed', req.url));
  }

  // Instead of processing here, redirect to a client-side page
  // that can handle the token exchange and show UI.
  const redirectUrl = new URL('/dashboard/gmail-linking', req.url);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', state);
  
  return NextResponse.redirect(redirectUrl);
}
