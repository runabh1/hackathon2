'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CalendarCheck2, Loader2 } from 'lucide-react';
import { updateAttendanceRecord } from '@/ai/flows/attendance-update';
import { useToast } from '@/hooks/use-toast';

export function UserStats() {
  const [attendance, setAttendance] = useState<'Present' | 'Absent'>('Absent');
  const [unreadEmails] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleMarkPresent = async () => {
    setIsLoading(true);
    try {
      const result = await updateAttendanceRecord({
        studentId: 'mock-student-123',
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
          <div className="font-bold text-lg text-primary">{unreadEmails}</div>
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
