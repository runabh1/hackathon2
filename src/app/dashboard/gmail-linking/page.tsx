'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { emailManagerTool } from '@/ai/flows/email-manager';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GmailLinkingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [message, setMessage] = useState('Linking your Gmail account, please wait...');
  const [error, setError] = useState('');

  useEffect(() => {
    // Make sure we have the user and the required search parameters.
    if (userLoading) {
      return; // Wait for user to be loaded
    }
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!user) {
      // If user is not logged in, redirect to login page.
      router.replace('/login');
      return;
    }

    if (!code || !state) {
      setError('Invalid request. Missing authorization code or state.');
      return;
    }

    if (state !== user.uid) {
      setError('State mismatch. CSRF attack detected or invalid state. Please try linking again.');
      return;
    }

    const linkAccount = async () => {
      try {
        const result = await emailManagerTool.run({
          userId: user.uid,
          authCode: code,
        });

        if (result.startsWith('Error:')) {
          throw new Error(result);
        }

        toast({
          title: 'Success!',
          description: 'Your Gmail account has been linked.',
        });
        
        // Redirect to dashboard on success.
        router.replace('/dashboard');

      } catch (e: any) {
        console.error('Error during token exchange:', e);
        setError(`Failed to link account: ${e.message || 'An unknown error occurred.'}`);
        toast({
            variant: 'destructive',
            title: 'Linking Failed',
            description: `Could not link your Gmail account. ${e.message}`,
        });
      }
    };

    linkAccount();

  }, [user, userLoading, searchParams, router, toast]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <>
            <p className="text-destructive text-center">{error}</p>
            <button onClick={() => router.replace('/dashboard')} className="text-primary underline">
              Return to Dashboard
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
