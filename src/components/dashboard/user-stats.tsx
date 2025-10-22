'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CalendarCheck2, Loader2, Link as LinkIcon } from 'lucide-react';
import { updateAttendanceRecord } from '@/ai/flows/attendance-update';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';

async function getGoogleAuthUrl() {
    const response = await fetch('/api/auth/google/url');
    const data = await response.json();
    return data.url;
}

export function UserStats() {
  const [attendance, setAttendance] = useState<'Present' | 'Absent'>('Absent');
  const [unreadEmails, setUnreadEmails] = useState(0); // This will be updated by the tool
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const integrationDocPath = user ? `/users/${user.uid}/integrations/gmail` : '';
  const { data: gmailIntegration, loading: loadingIntegration } = useDoc(integrationDocPath);

  const isGmailLinked = gmailIntegration && gmailIntegration.refreshToken;

  const handleLinkGmail = async () => {
    try {
        const authUrl = await getGoogleAuthUrl();
        window.location.href = authUrl;
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
          {isGmailLinked ? (
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
