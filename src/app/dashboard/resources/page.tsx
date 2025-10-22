'use client';

import React, { useState, useMemo, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookUp, File, Trash2, Download } from 'lucide-react';
import { useUser, useFirestore, useCollection, useStorage } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addMaterial, removeMaterial, type StudyMaterial } from '@/lib/materials';
import { Progress } from '@/components/ui/progress';

export default function ResourcesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const [courseId, setCourseId] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { toast } = useToast();

  const materialsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'study_materials'), where('userId', '==', user.uid));
  }, [user, firestore]);

  const { data: materials, loading: loadingMaterials } = useCollection<StudyMaterial>(materialsQuery);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    } else {
      setFileToUpload(null);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !courseId.trim() || !user || !firestore || !storage) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a file, provide a course ID, and ensure you are logged in.',
      });
      return;
    }
    setIsUploading(true);

    // Create a storage reference: `users/{userId}/materials/{fileName}`
    const storageRef = ref(storage, `users/${user.uid}/materials/${fileToUpload.name}`);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Could not upload your file. Please try again.',
        });
        setIsUploading(false);
        setUploadProgress(0);
      },
      async () => {
        // Upload completed successfully, now get the download URL
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addMaterial(firestore, {
              courseId,
              userId: user.uid,
              fileName: fileToUpload.name,
              downloadUrl,
          });

          toast({
            title: 'Upload Successful!',
            description: `Your file "${fileToUpload.name}" has been saved for course "${courseId}".`,
          });
          
          // Reset form
          setFileToUpload(null);
          setCourseId('');

        } catch (error) {
            console.error('Failed to save material reference:', error);
            toast({
                variant: 'destructive',
                title: 'Saving Failed',
                description: 'Your file was uploaded but we could not save its reference. Please contact support.',
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
      }
    );
  };
  
  const handleRemoveMaterial = async (material: StudyMaterial) => {
      if (!firestore) return;
      try {
          await removeMaterial(firestore, material.id);
          toast({
              title: "Material Removed",
              description: `"${material.fileName}" has been removed.`,
          });
          // Note: Storage object deletion is not handled here to keep it simple,
          // but in a production app, you'd want to delete the file from Storage as well.
      } catch (error) {
          console.error("Failed to remove material:", error);
          toast({
              variant: "destructive",
              title: "Removal Failed",
              description: "Could not remove the material. Please try again."
          });
      }
  }

  const isFormSubmittable = fileToUpload && courseId.trim() && !isUploading && user;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="shadow-lg animate-in fade-in-0 zoom-in-95">
          <CardHeader>
            <div className="flex items-center gap-4">
              <BookUp className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline tracking-tight">Upload Study Material</CardTitle>
                <CardDescription>Upload your lecture notes, PDFs, and other study aids.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadMaterial} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course ID</Label>
                <Input id="courseId" placeholder="E.g., CHEM-101, HIST-203" value={courseId} onChange={(e) => setCourseId(e.target.value)} required disabled={isUploading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-upload">PDF Document</Label>
                <Input id="file-upload" type="file" onChange={handleFileSelect} accept=".pdf" disabled={isUploading} />
              </div>

              {isUploading && (
                <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
                </div>
              )}

              <Button type="submit" className="w-full font-semibold" disabled={!isFormSubmittable}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : 'Upload and Save'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg animate-in fade-in-0 zoom-in-95 delay-150">
            <CardHeader>
                <CardTitle>My Materials</CardTitle>
                <CardDescription>A list of all your uploaded study materials.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingMaterials ? (
                    <div className="text-center text-muted-foreground py-8">Loading materials...</div>
                ) : materials && materials.length > 0 ? (
                    <div className="space-y-3">
                        {materials.map(material => (
                            <div key={material.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                <div className="flex items-center gap-3">
                                    <File className="h-5 w-5 text-primary" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{material.fileName}</span>
                                        <span className="text-xs text-muted-foreground">{material.courseId}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button asChild variant="ghost" size="icon">
                                        <a href={material.downloadUrl} target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMaterial(material)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>You haven't uploaded any materials yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
