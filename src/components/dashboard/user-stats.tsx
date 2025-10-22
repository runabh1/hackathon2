'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CalendarCheck2, Loader2, Link as LinkIcon } from 'lucide-react';
import { updateAttendanceRecord } from '@/ai/flows/attendance-update';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc } from '@/firebase';

async function getGoogleAuthUrl() {
    const response = await fetch('/api/auth/google/url');
    if (!response.ok) {
        throw new Error('Failed to get auth URL');
    }
    const data = await response.json();
    return data.url;
}

export function UserStats() {
  const [attendance, setAttendance] = useState<'Present' | 'Absent'>('Absent');
  const [unreadEmails, setUnreadEmails] = useState(0); // This will be updated by the tool
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const integrationDocPath = useMemo(() => {
    if (!user) return null;
    return `users/${user.uid}/integrations/gmail`;
  }, [user]);

  const { data: gmailIntegration, loading: loadingIntegration } = useDoc(integrationDocPath);


  const isGmailLinked = !!(gmailIntegration && gmailIntegration.refreshToken);

  const handleLinkGmail = async () => {
    try {
        const authUrl = await getGoogleAuthUrl();
        // Open in a new tab to avoid iframe security issues
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

  const handleMarkPresent = async () => {
    setIsLoading(true);
    try {
      const result = await updateAttendanceRecord({
        studentId: user?.uid || 'unknown-user',
        date: new Date().toISOString().split('T')[0],
        isPresent: true,
      });
      if (result.success) {
        setAttendance('Present');
        toast({
          title: 'Attendance Updated',
          description: "You've been marked as present for today.",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to update attendance:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your attendance. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="p-2">
                <CardTitle className="text-base font-semibold">Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-4">
                <div className="flex items-center justify-between p-2 rounded-md bg-sidebar-accent h-10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-sidebar-accent h-10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-2">
        <CardTitle className="text-base font-semibold">Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-4">
        <div className="flex items-center justify-between p-2 rounded-md bg-sidebar-accent">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <span className="font-medium text-sm">Unread Emails</span>
          </div>
          {loadingIntegration ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isGmailLinked ? (
            <div className="font-bold text-lg text-primary">{unreadEmails}</div>
          ) : (
             <Button onClick={handleLinkGmail} size="sm" variant="ghost" className="h-7 text-xs">
                <LinkIcon className="mr-2 h-3 w-3" />
                Link
             </Button>
          )}
        </div>
        <div className="flex items-center justify-between p-2 rounded-md bg-sidebar-accent">
          <div className="flex items-center gap-3">
            <CalendarCheck2 className="w-5 h-5 text-primary" />
            <span className="font-medium text-sm">Attendance</span>
          </div>
          <div
            className={`font-bold text-sm ${
              attendance === 'Present' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {attendance}
          </div>
        </div>
        {attendance === 'Absent' && (
          <Button onClick={handleMarkPresent} disabled={isLoading} size="sm" className="w-full font-semibold">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as Present
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
