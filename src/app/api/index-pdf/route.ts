// src/app/api/index-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { indexMaterial } from '@/ai/flows/index-material-flow';
import { getAdminDb } from '@/lib/firebase/tokenService';
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const courseId = formData.get('courseId') as string | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !courseId || !userId) {
      return NextResponse.json({ error: 'File, courseId, and userId are required.' }, { status: 400 });
    }

    // Parse the PDF
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(fileBuffer);
    const documentText = pdfData.text;

    // 1. Call the Genkit flow to get processed chunks
    const processedChunks = await indexMaterial({ documentText });

    // 2. Use the Admin SDK here in the API route to write to Firestore
    const firestore = getAdminDb();
    const collectionRef = firestore.collection('study_material_vectors');
    const batch = firestore.batch();

    for (const chunk of processedChunks) {
      const docRef = collectionRef.doc(); // Auto-generate ID
      batch.set(docRef, {
        ...chunk,
        source_url: file.name,
        course_id: courseId,
        userId: userId,
        createdAt: new Date(),
      });
    }

    await batch.commit();

    return NextResponse.json({ message: `Successfully indexed ${processedChunks.length} chunks from ${file.name}.` });

  } catch (error: any) {
    console.error('[API - INDEX PDF]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during PDF indexing.' },
      { status: 500 }
    );
  }
}
