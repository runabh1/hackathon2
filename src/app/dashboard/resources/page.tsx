'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookUp, FileText, Upload, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from '@/firebase';

export default function ResourcesPage() {
  const { user } = useUser();

  // State for the text paste form
  const [documentText, setDocumentText] = useState('');
  const [textCourseId, setTextCourseId] = useState('');
  const [textSourceUrl, setTextSourceUrl] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);
  
  // State for the PDF upload form
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfCourseId, setPdfCourseId] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsTextLoading(true);

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
      setIsTextLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleIndexPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !pdfCourseId.trim() || !user) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a PDF file, provide a course ID, and be logged in.',
      });
      return;
    }
    setIsPdfLoading(true);

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('courseId', pdfCourseId);
    formData.append('userId', user.uid);

    try {
      const response = await fetch('/api/index-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to process PDF.');

      toast({
        title: 'PDF Indexing Successful!',
        description: `${result.message}. You can now ask questions about its content.`,
      });
      setPdfFile(null);
      setPdfCourseId('');
      if(fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'PDF Upload Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const isTextFormSubmittable = documentText.trim() && textCourseId.trim() && !isTextLoading && user;
  const isPdfFormSubmittable = pdfFile && pdfCourseId.trim() && !isPdfLoading && user;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex items-center gap-4">
            <BookUp className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline tracking-tight">Add Study Materials</CardTitle>
              <CardDescription>Upload PDFs or paste notes to make the AI mentor context-aware.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paste-text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste-text">Paste Text</TabsTrigger>
              <TabsTrigger value="upload-pdf">Upload PDF</TabsTrigger>
            </TabsList>
            <TabsContent value="paste-text">
              <form onSubmit={handleIndexMaterial} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="textSourceUrl">Source URL (Optional)</Label>
                  <Input id="textSourceUrl" placeholder="https://example.com/notes.pdf" value={textSourceUrl} onChange={(e) => setTextSourceUrl(e.target.value)} disabled={isTextLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentText">Paste Your Notes</Label>
                  <Textarea id="documentText" placeholder="Paste raw text from your lecture notes..." value={documentText} onChange={(e) => setDocumentText(e.target.value)} required className="min-h-[300px]" disabled={isTextLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textCourseId">Course ID</Label>
                  <Input id="textCourseId" placeholder="E.g., CHEM-101, HIST-203" value={textCourseId} onChange={(e) => setTextCourseId(e.target.value)} required disabled={isTextLoading} />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={!isTextFormSubmittable}>
                  {isTextLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Save and Index Text'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="upload-pdf">
              <form onSubmit={handleIndexPdf} className="space-y-6 mt-4">
                 <div className="space-y-2">
                    <Label htmlFor="file-upload">PDF Document</Label>
                    {pdfFile ? (
                        <div className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                            <div className='flex items-center gap-2'>
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium truncate">{pdfFile.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setPdfFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background p-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer">
                            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                            <p className="mt-1 text-xs text-muted-foreground">PDF (max. 5MB)</p>
                            <Input id="file-upload" ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isPdfLoading}/>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdfCourseId">Course ID</Label>
                  <Input id="pdfCourseId" placeholder="E.g., PHYS-201, CS-450" value={pdfCourseId} onChange={(e) => setPdfCourseId(e.target.value)} required disabled={isPdfLoading} />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={!isPdfFormSubmittable}>
                  {isPdfLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading & Processing...</> : 'Upload and Index PDF'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
