// src/app/api/index-material/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { indexMaterial, ProcessedChunk } from '@/ai/flows/index-material-flow';
import { getAdminDb } from '@/lib/firebase/tokenService';

export async function POST(req: NextRequest) {
  try {
    const body: {
        documentText: string;
        courseId: string;
        sourceUrl: string;
        userId: string;
    } = await req.json();

    // Basic validation
    if (!body.documentText || !body.courseId || !body.userId) {
      return NextResponse.json({ error: 'documentText, courseId, and userId are required.' }, { status: 400 });
    }

    // 1. Call the Genkit flow to chunk and embed the text.
    const processedChunks = await indexMaterial({ documentText: body.documentText });

    // 2. Use the Admin SDK in the API route to write to Firestore.
    const firestore = getAdminDb();
    const collectionRef = firestore.collection('study_material_vectors');
    const batch = firestore.batch();

    for (const chunk of processedChunks) {
      const docRef = collectionRef.doc(); // Auto-generate ID
      batch.set(docRef, {
        ...chunk,
        source_url: body.sourceUrl,
        course_id: body.courseId,
        userId: body.userId,
        createdAt: new Date(),
      });
    }

    await batch.commit();

    return NextResponse.json({ message: `Successfully indexed ${processedChunks.length} chunks.` });

  } catch (error: any) {
    console.error('[API - INDEX MATERIAL]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during indexing.' },
      { status: 500 }
    );
  }
}
