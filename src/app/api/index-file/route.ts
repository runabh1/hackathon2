// src/app/api/index-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/tokenService';
import { indexMaterial } from '@/ai/flows/index-material-flow';
import pdf from 'pdf-parse';

// Increase the default body size limit to handle larger file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileContent, fileName, courseId, userId } = body;

    if (!fileContent || !fileName || !courseId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Decode the Base64 file content
    const buffer = Buffer.from(fileContent, 'base64');
    
    // Extract text from the PDF
    let textContent = '';
    if (fileName.toLowerCase().endsWith('.pdf')) {
      const data = await pdf(buffer);
      textContent = data.text;
    } else {
        // Assume it's a plain text file
        textContent = buffer.toString('utf-8');
    }

    if (!textContent) {
        return NextResponse.json({ error: 'Could not extract text from the file.' }, { status: 400 });
    }

    // Call the Genkit flow to chunk and embed the text
    const { vectors } = await indexMaterial({
      text: textContent,
      courseId,
      userId,
    });

    // Save the vectors to Firestore using the Admin SDK
    const db = getAdminDb();
    const batch = db.batch();
    const vectorsCollection = db.collection('study_material_vectors');

    vectors.forEach(vector => {
      const docRef = vectorsCollection.doc(); // Auto-generate ID
      batch.set(docRef, vector);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${vectors.length} chunks for course ${courseId}.`,
    });

  } catch (error: any) {
    console.error('Error indexing file:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
