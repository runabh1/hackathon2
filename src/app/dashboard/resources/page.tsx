'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookUp } from 'lucide-react';
import { useUser } from '@/firebase';

export default function ResourcesPage() {
  const { user } = useUser();

  const [documentText, setDocumentText] = useState('');
  const [textCourseId, setTextCourseId] = useState('');
  const [textSourceUrl, setTextSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const handleIndexMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentText.trim() || !textCourseId.trim() || !user) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide the document text, a course ID, and be logged in.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/index-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          courseId: textCourseId,
          sourceUrl: textSourceUrl || 'pasted-text',
          userId: user.uid,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to index material.');

      toast({
        title: 'Indexing Successful!',
        description: `Your notes for course "${textCourseId}" have been indexed.`,
      });
      setDocumentText('');
      setTextCourseId('');
      setTextSourceUrl('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Indexing Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormSubmittable = documentText.trim() && textCourseId.trim() && !isLoading && user;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex items-center gap-4">
            <BookUp className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline tracking-tight">Add Study Materials</CardTitle>
              <CardDescription>Paste your notes here to make the AI mentor context-aware.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleIndexMaterial} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="textSourceUrl">Source URL (Optional)</Label>
                  <Input id="textSourceUrl" placeholder="https://example.com/notes.html" value={textSourceUrl} onChange={(e) => setTextSourceUrl(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentText">Paste Your Notes</Label>
                  <Textarea id="documentText" placeholder="Paste raw text from your lecture notes, articles, or other study materials..." value={documentText} onChange={(e) => setDocumentText(e.target.value)} required className="min-h-[400px]" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textCourseId">Course ID</Label>
                  <Input id="textCourseId" placeholder="E.g., CHEM-101, HIST-203" value={textCourseId} onChange={(e) => setTextCourseId(e.target.value)} required disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={!isFormSubmittable}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Save and Index Notes'}
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
