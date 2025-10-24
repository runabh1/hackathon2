// src/app/api/index-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { indexMaterial } from '@/ai/flows/index-material-flow';
import pdf from 'pdf-parse';
import type { Firestore } from 'firebase-admin/firestore';

// --- API Configuration ---
// Increase the default body size limit to handle larger file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// --- API Handler ---

export async function POST(req: NextRequest) {
  try {
    const db: Firestore = getAdminDb(); // Get the guaranteed singleton instance of Firestore
    const body = await req.json();
    const { fileContent, fileName, courseId, userId } = body;

    if (!fileContent || !fileName || !courseId || !userId) {
      return NextResponse.json({ error: 'Missing required fields: fileContent, fileName, courseId, and userId are required.' }, { status: 400 });
    }

    // 1. Extract Text from file buffer
    const buffer = Buffer.from(fileContent, 'base64');
    let textContent = '';
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      const data = await pdf(buffer); // Correctly await the promise
      textContent = data.text;
    } else {
      textContent = buffer.toString('utf-8'); // Correctly handle plain text
    }

    if (!textContent.trim()) {
        return NextResponse.json({ error: 'Could not extract any text from the file.' }, { status: 400 });
    }

    // 2. Call Genkit flow to chunk and embed the text
    const { vectors } = await indexMaterial({
      text: textContent,
      courseId,
      userId,
    });

    if (!vectors || vectors.length === 0) {
        console.warn(`No vectors were generated for course ${courseId}. The document might be empty or the AI flow failed to produce output.`);
        // Still a success, but let the user know nothing was indexed.
        return NextResponse.json({
            success: true,
            message: `File processed, but no content was indexed. The document might be empty or too short.`
        });
    }

    // 3. Save the vectors to Firestore using the Admin SDK
    const batch = db.batch();
    const vectorsCollection = db.collection('study_material_vectors');

    vectors.forEach(vector => {
      const docRef = vectorsCollection.doc(); // Auto-generate ID with Admin SDK
      batch.set(docRef, vector);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${vectors.length} chunks for course ${courseId}.`,
    });

  } catch (error: any) {
    // This is the most important part: catch ANY error and return a JSON response.
    console.error('CRITICAL ERROR in /api/index-file:', error.stack || error.message);
    return NextResponse.json({ error: error.message || 'An unexpected internal server error occurred.' }, { status: 500 });
  }
}
