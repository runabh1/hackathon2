'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, Book, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Subject = {
  name: string;
  attended: number;
  total: number;
};

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newTotalClasses, setNewTotalClasses] = useState('');
  const { toast } = useToast();

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(newTotalClasses, 10);
    if (newSubject.trim() && !isNaN(total) && total > 0 && !subjects.find(s => s.name.toLowerCase() === newSubject.toLowerCase().trim())) {
      setSubjects([...subjects, { name: newSubject.trim(), attended: 0, total: total }]);
      setNewSubject('');
      setNewTotalClasses('');
      toast({
        title: 'Subject Added',
        description: `"${newSubject.trim()}" has been added with ${total} total classes.`,
      });
    } else if (subjects.find(s => s.name.toLowerCase() === newSubject.toLowerCase().trim())) {
        toast({
            variant: 'destructive',
            title: 'Subject Exists',
            description: 'This subject is already in your list.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Invalid Input',
            description: 'Please enter a valid subject name and a total number of classes greater than 0.',
        });
    }
  };

  const handleAttendanceChange = (subjectName: string, change: 'increment' | 'decrement') => {
    setSubjects(subjects.map(s => {
      if (s.name === subjectName) {
        if (change === 'increment' && s.attended < s.total) {
          return { ...s, attended: s.attended + 1 };
        }
        if (change === 'decrement' && s.attended > 0) {
          return { ...s, attended: s.attended - 1 };
        }
      }
      return s;
    }));
  };
  
  const handleRemoveSubject = (subjectName: string) => {
    setSubjects(subjects.filter(s => s.name !== subjectName));
    toast({
        title: 'Subject Removed',
        description: `"${subjectName}" has been removed.`,
    });
  };

  const calculatePercentage = (attended: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-3xl mx-auto shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="text-2xl font-headline tracking-tight">Attendance Tracker</CardTitle>
          <CardDescription>Monitor your class attendance and stay on top of your academic commitments.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-2 mb-6">
            <Input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="E.g., Quantum Physics"
              className="flex-grow"
            />
            <Input
              type="number"
              value={newTotalClasses}
              onChange={(e) => setNewTotalClasses(e.target.value)}
              placeholder="Total Classes"
              className="w-full sm:w-32"
              min="1"
            />
            <Button type="submit" className="font-semibold">Add Subject</Button>
          </form>

          <div className="space-y-4">
            {subjects.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <Book className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-lg">Your attendance sheet is empty.</p>
                    <p className="text-sm">Add a subject above to start tracking!</p>
                </div>
            ) : subjects.map(subject => {
                const percentage = calculatePercentage(subject.attended, subject.total);
                return (
                    <Card key={subject.name} className="flex flex-col sm:flex-row items-start sm:items-center p-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="flex-grow mb-4 sm:mb-0">
                        <p className="font-bold text-lg">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Attended: <span className="font-bold text-primary">{subject.attended}</span> / {subject.total}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <Progress value={percentage} className="w-full sm:w-64 h-2" />
                            <span className={cn(
                                "font-semibold text-sm",
                                percentage >= 75 ? "text-green-600" : "text-orange-500"
                            )}>
                                {percentage}%
                            </span>
                        </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button size="icon" variant="outline" onClick={() => handleAttendanceChange(subject.name, 'decrement')}>
                            <Minus className="h-4 w-4" />
                            <span className="sr-only">Decrement attendance</span>
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => handleAttendanceChange(subject.name, 'increment')}>
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Increment attendance</span>
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleRemoveSubject(subject.name)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove subject</span>
                        </Button>
                        </div>
                    </Card>
                )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
