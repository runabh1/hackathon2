
// src/app/api/index-file/route.ts
import 'dotenv/config'; // Ensure environment variables are loaded
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { indexMaterial } from '@/ai/flows/index-material-flow';
import pdf from 'pdf-parse';

// --- Firebase Admin Initialization (Self-contained) ---
// This ensures the Admin SDK is initialized reliably within the API route's environment.

let db: Firestore;

function initializeAdminApp() {
    const adminAppName = 'file-indexing-admin-app';
    const existingApp = getApps().find(app => app.name === adminAppName);
    
    if (existingApp) {
        if (!db) {
            db = getFirestore(existingApp);
        }
        return;
    }

    let serviceAccount: ServiceAccount;
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or empty.');
        }
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e: any) {
        console.error("FATAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e.message);
        throw new Error("Firebase Admin SDK initialization failed due to invalid service account key.");
    }

    try {
        const app = initializeApp({
            credential: cert(serviceAccount),
        }, adminAppName);
        db = getFirestore(app);
    } catch (e: any) {
        console.error("FATAL: Failed to initialize Firebase Admin App.", e.message);
        throw new Error("Firebase Admin SDK could not be initialized.");
    }
}

// Ensure the admin app is initialized when the module loads
initializeAdminApp();

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
    const body = await req.json();
    const { fileContent, fileName, courseId, userId } = body;

    if (!fileContent || !fileName || !courseId || !userId) {
      return NextResponse.json({ error: 'Missing required fields: fileContent, fileName, courseId, userId are required.' }, { status: 400 });
    }

    // 1. Extract Text from file
    const buffer = Buffer.from(fileContent, 'base64');
    let textContent = '';
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      const data = await pdf(buffer);
      textContent = data.text;
    } else {
      textContent = buffer.toString('utf-8');
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
        console.warn(`No vectors were generated for course ${courseId}. This might mean the document was too short.`);
        return NextResponse.json({
            success: true,
            message: `File processed, but no content was indexed. The document might be empty or too short.`
        });
    }

    // 3. Save the vectors to Firestore using the Admin SDK
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
    console.error('ERROR in /api/index-file:', error);
    // Return a structured JSON error instead of crashing
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
