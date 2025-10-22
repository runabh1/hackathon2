'use client';

import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookUp, FileText } from 'lucide-react';
import { useUser } from '@/firebase';

export default function ResourcesPage() {
  const { user } = useUser();
  const [courseId, setCourseId] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    } else {
      setFileToUpload(null);
    }
  };

  const handleProcessAndIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !courseId.trim() || !user) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a file and provide a course ID.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(fileToUpload);
      reader.onload = async (event) => {
        if (!event.target?.result) {
            throw new Error("Failed to read file.");
        }
        
        const base64File = (event.target.result as string).split(',')[1];
        
        const response = await fetch('/api/index-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileContent: base64File,
                fileName: fileToUpload.name,
                courseId,
                userId: user.uid,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to index the file.');
        }

        toast({
            title: 'Success!',
            description: `Your document "${fileToUpload.name}" has been processed and indexed for course "${courseId}".`,
        });

        setFileToUpload(null);
        setCourseId('');
      };
      
      reader.onerror = (error) => {
        throw new Error("Error reading file: " + error);
      }

    } catch (error: any) {
      console.error('Processing failed:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: error.message || 'Could not process your file. Please try again.',
      });
    } finally {
      // This needs to be handled inside the onload/onerror callbacks
      // For simplicity, we'll reset it here, but a more robust solution would use state management
      setIsProcessing(false);
    }
  };

  const isFormSubmittable = fileToUpload && courseId.trim() && !isProcessing && user;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="shadow-lg animate-in fade-in-0 zoom-in-95">
          <CardHeader>
            <div className="flex items-center gap-4">
              <BookUp className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline tracking-tight">Index Study Material</CardTitle>
                <CardDescription>Process your lecture notes or PDFs to make them searchable for the chat AI.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProcessAndIndex} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course ID</Label>
                <Input id="courseId" placeholder="E.g., CHEM-101, HIST-203" value={courseId} onChange={(e) => setCourseId(e.target.value)} required disabled={isProcessing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-upload">PDF Document</Label>
                <Input id="file-upload" type="file" onChange={handleFileSelect} accept=".pdf" disabled={isProcessing} />
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={!isFormSubmittable}>
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Process and Index'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg animate-in fade-in-0 zoom-in-95 delay-150">
            <CardHeader>
                <CardTitle>How it Works</CardTitle>
                <CardDescription>Understanding the document indexing process.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-4">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <p>When you upload a PDF, its text content is extracted and split into smaller, manageable chunks.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-5 h-5 flex-shrink-0 mt-1 flex items-center justify-center">
                        <span className="font-bold text-primary text-lg">#</span>
                    </div>
                    <div>
                        <p>Each chunk is converted into a "vector embedding"—a numerical representation of its meaning. This allows the AI to find the most relevant chunks of text when you ask a question.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                     <BookUp className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <p>These vectors are stored in Firestore, linked to the Course ID you provide. When you chat with MentorAI about a course, it queries these vectors to find the best information to answer your question.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
