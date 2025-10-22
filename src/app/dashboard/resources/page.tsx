
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookUp } from 'lucide-react';

export default function ResourcesPage() {
  const [documentText, setDocumentText] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleIndexMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentText.trim() || !courseId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide the document text and a course ID.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/index-material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentText,
          courseId,
          sourceUrl: sourceUrl || 'pasted-text',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to index material.');
      }

      toast({
        title: 'Indexing Successful!',
        description: `Your notes for course "${courseId}" have been indexed. You can now ask questions about them.`,
      });
      // Clear the form
      setDocumentText('');
      setCourseId('');
      setSourceUrl('');
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
  
  const isFormSubmittable = documentText.trim() && courseId.trim() && !isLoading;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex items-center gap-4">
            <BookUp className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline tracking-tight">Add Study Materials</CardTitle>
              <CardDescription>Paste your notes here to make the AI mentor context-aware for your courses.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleIndexMaterial} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
                    <Input
                        id="sourceUrl"
                        placeholder="https://example.com/notes.pdf"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="documentText">Paste Your Notes</Label>
                    <Textarea
                        id="documentText"
                        placeholder="Paste the raw text from your lecture notes, textbook chapters, or articles here..."
                        value={documentText}
                        onChange={(e) => setDocumentText(e.target.value)}
                        required
                        className="min-h-[300px]"
                        disabled={isLoading}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="courseId">Course ID</Label>
                    <Input
                        id="courseId"
                        placeholder="E.g., CHEM-101, HIST-203"
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
            
                <Button type="submit" className="w-full font-semibold" disabled={!isFormSubmittable}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                    </>
                ) : (
                    'Save and Index Material'
                )}
                </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
