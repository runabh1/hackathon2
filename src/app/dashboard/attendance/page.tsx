'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, Book, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Subject = {
  name: string;
  attended: number;
  missed: number;
};

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const { toast } = useToast();

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.trim() && !subjects.find(s => s.name.toLowerCase() === newSubject.toLowerCase().trim())) {
      setSubjects([...subjects, { name: newSubject.trim(), attended: 0, missed: 0 }]);
      setNewSubject('');
      toast({
        title: 'Subject Added',
        description: `"${newSubject.trim()}" has been added.`,
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
            description: 'Please enter a valid subject name.',
        });
    }
  };

  const handleCountChange = (subjectName: string, type: 'attended' | 'missed', change: 'increment' | 'decrement') => {
    setSubjects(subjects.map(s => {
      if (s.name === subjectName) {
        const currentValue = s[type];
        if (change === 'increment') {
          return { ...s, [type]: currentValue + 1 };
        }
        if (change === 'decrement' && currentValue > 0) {
          return { ...s, [type]: currentValue - 1 };
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
          <CardDescription>Track your attended and missed classes to stay on top of your academic commitments.</CardDescription>
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
            {subjects.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <Book className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-lg">Your attendance sheet is empty.</p>
                    <p className="text-sm">Add a subject above to start tracking!</p>
                </div>
            ) : subjects.map(subject => {
                const totalClasses = subject.attended + subject.missed;
                const percentage = calculatePercentage(subject.attended, subject.missed);
                return (
                    <Card key={subject.name} className="p-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center">
                            <div className="flex-grow mb-4 sm:mb-0">
                                <p className="font-bold text-lg">{subject.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Total Classes: <span className="font-bold text-primary">{totalClasses}</span>
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

                            <div className="flex flex-wrap items-center gap-4 self-start sm:self-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Attended:</span>
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.name, 'attended', 'decrement')}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold w-4 text-center">{subject.attended}</span>
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.name, 'attended', 'increment')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Missed:</span>
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.name, 'missed', 'decrement')}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold w-4 text-center">{subject.missed}</span>
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleCountChange(subject.name, 'missed', 'increment')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleRemoveSubject(subject.name)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove subject</span>
                                </Button>
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
