'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, Book, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase';
import { addSubject, updateSubjectCount, removeSubject, type Subject } from '@/lib/firestore';
import { collection, query, where } from 'firebase/firestore';

export default function AttendancePage() {
  const [newSubject, setNewSubject] = useState('');
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const subjectsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'subjects'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: subjects, loading } = useCollection<Subject>(subjectsQuery);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a valid subject name.',
      });
      return;
    }
    if (subjects?.find(s => s.name.toLowerCase() === newSubject.toLowerCase().trim())) {
      toast({
        variant: 'destructive',
        title: 'Subject Exists',
        description: 'This subject is already in your list.',
      });
      return;
    }
    if (firestore && user) {
        await addSubject(firestore, {
            name: newSubject.trim(),
            attended: 0,
            missed: 0,
            userId: user.uid,
        });
        setNewSubject('');
        toast({
            title: 'Subject Added',
            description: `"${newSubject.trim()}" has been added.`,
        });
    }
  };

  const handleCountChange = (subjectId: string, type: 'attended' | 'missed', change: 'increment' | 'decrement') => {
    if (!firestore) return;
    const subject = subjects?.find(s => s.id === subjectId);
    if (!subject) return;

    const currentValue = subject[type];
    let newValue = currentValue;
    if (change === 'increment') {
      newValue = currentValue + 1;
    } else if (change === 'decrement' && currentValue > 0) {
      newValue = currentValue - 1;
    }
    updateSubjectCount(firestore, subjectId, type, newValue);
  };
  
  const handleRemoveSubject = (subjectId: string, subjectName: string) => {
    if (!firestore) return;
    removeSubject(firestore, subjectId);
    toast({
        title: 'Subject Removed',
        description: `"${subjectName}" has been removed.`,
    });
  };

  const calculatePercentage = (attended: number, missed: number) => {
    const total = attended + missed;
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="text-2xl font-headline tracking-tight">Attendance Manager</CardTitle>
          <CardDescription>Track your attended and missed classes. Your data is saved automatically.</CardDescription>
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
            <Button type="submit" className="font-semibold">Add Subject</Button>
          </form>

          <div className="space-y-4">
            {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : subjects && subjects.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <Book className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-lg">Your attendance sheet is empty.</p>
                    <p className="text-sm">Add a subject above to start tracking!</p>
                </div>
            ) : subjects?.map(subject => {
                const totalClasses = subject.attended + subject.missed;
                const percentage = calculatePercentage(subject.attended, subject.missed);
                return (
                  <Card key={subject.id} className="p-4 transition-all hover:shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                      <div className="sm:col-span-1">
                        <p className="font-bold text-lg truncate">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total Classes: <span className="font-bold text-primary">{totalClasses}</span>
                        </p>
                      </div>
                      <div className="sm:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-full h-2" />
                          <span className={cn(
                              "font-semibold text-sm w-12 text-right",
                              percentage >= 75 ? "text-green-600" : "text-orange-500"
                          )}>
                              {percentage}%
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Attended:</span>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.id, 'attended', 'decrement')}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold w-5 text-center">{subject.attended}</span>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.id, 'attended', 'increment')}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Missed:</span>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.id, 'missed', 'decrement')}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold w-5 text-center">{subject.missed}</span>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.id, 'missed', 'increment')}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleRemoveSubject(subject.id, subject.name)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove subject</span>
                            </Button>
                        </div>
                      </div>
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
