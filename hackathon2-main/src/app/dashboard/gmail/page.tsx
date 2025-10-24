'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Link as LinkIcon, AlertTriangle, Info } from 'lucide-react';
import { useUser, useDoc } from '@/firebase';

async function getGoogleAuthUrl(userId: string) {
    const response = await fetch(`/api/auth/google/url?userId=${userId}`);
    if (!response.ok) {
        throw new Error('Failed to get auth URL');
    }
    const data = await response.json();
    return data.url;
}

export default function GmailPage() {
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();

  const integrationDocPath = user ? `users/${user.uid}/integrations/gmail` : null;

  const { data: gmailIntegration, loading: loadingIntegration } = useDoc(integrationDocPath);

  const isGmailLinked = !!(gmailIntegration && gmailIntegration.refreshToken);
  
  const handleLinkGmail = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You must be logged in to link your Gmail account.',
        });
        return;
    }
    try {
        const authUrl = await getGoogleAuthUrl(user.uid);
        window.open(authUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Failed to get Google auth URL', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Link Gmail',
            description: 'Could not start the Gmail linking process. Please try again.',
        });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="shadow-lg animate-in fade-in-0 zoom-in-95">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline tracking-tight">Gmail Analyzer</CardTitle>
                <CardDescription>Link your Gmail to let MentorAI read, search, and summarize your emails.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
                <div>
                    {loadingIntegration || userLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <p>Checking Gmail integration status...</p>
                        </div>
                    ) : isGmailLinked ? (
                        <div className="p-4 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded-md">
                            <div className="flex items-center gap-4">
                                <Info className="h-6 w-6 text-green-700 dark:text-green-300" />
                                <div>
                                    <h3 className="font-semibold text-green-800 dark:text-green-200">Gmail Account Linked</h3>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        You can now ask the chat agent to find or summarize your emails.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 rounded-md">
                             <div className="flex items-center gap-4">
                                <AlertTriangle className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                                <div>
                                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">Link Your Gmail Account</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                                        To enable email features, you need to grant MentorAI permission to read your emails.
                                    </p>
                                     <Button onClick={handleLinkGmail}>
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        Link Gmail Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold">Example Prompts:</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                        <li>"Summarize my latest unread emails."</li>
                        <li>"Are there any emails from my professor about the upcoming exam?"</li>
                        <li>"Find the email with the tracking number for my book order."</li>
                        <li>"What was the main point of the email from the library yesterday?"</li>
                    </ul>
                </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
