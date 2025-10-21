'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Minus, Book, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Subject = {
  name: string;
  attended: number;
};

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const { toast } = useToast();

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.trim() && !subjects.find(s => s.name.toLowerCase() === newSubject.toLowerCase().trim())) {
      setSubjects([...subjects, { name: newSubject.trim(), attended: 0 }]);
      setNewSubject('');
      toast({
        title: 'Subject Added',
        description: `"${newSubject.trim()}" has been added to your list.`,
      });
    } else if (subjects.find(s => s.name.toLowerCase() === newSubject.toLowerCase().trim())) {
        toast({
            variant: 'destructive',
            title: 'Subject Exists',
            description: 'This subject is already in your list.',
        });
    }
  };

  const handleAttendanceChange = (subjectName: string, change: number) => {
    setSubjects(subjects.map(s => 
      s.name === subjectName ? { ...s, attended: Math.max(0, s.attended + change) } : s
    ));
  };
  
  const handleRemoveSubject = (subjectName: string) => {
    setSubjects(subjects.filter(s => s.name !== subjectName));
    toast({
        title: 'Subject Removed',
        description: `"${subjectName}" has been removed.`,
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Attendance Manager</CardTitle>
          <CardDescription>Add your subjects and track your attendance for each class.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubject} className="flex gap-2 mb-6">
            <Input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="E.g., Artificial Intelligence"
              className="flex-grow"
            />
            <Button type="submit">Add Subject</Button>
          </form>

          <div className="space-y-4">
            {subjects.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <Book className="mx-auto h-12 w-12" />
                    <p className="mt-2">No subjects added yet. Add a subject to start tracking attendance.</p>
                </div>
            ) : subjects.map(subject => (
              <Card key={subject.name} className="flex items-center p-4">
                <div className="flex-grow">
                  <p className="font-semibold">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Classes attended: <span className="font-bold text-primary">{subject.attended}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => handleAttendanceChange(subject.name, -1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => handleAttendanceChange(subject.name, 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleRemoveSubject(subject.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
