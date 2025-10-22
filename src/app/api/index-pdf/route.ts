// src/app/api/index-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { indexMaterial } from '@/ai/flows/index-material-flow';
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const courseId = formData.get('courseId') as string | null;
    const userId = formData.get('userId') as string | null; // Get userId from form data

    if (!file || !courseId || !userId) {
      return NextResponse.json({ error: 'File, courseId, and userId are required.' }, { status: 400 });
    }

    // Convert file to buffer to be processed by pdf-parse
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Parse the PDF
    const pdfData = await pdf(fileBuffer);
    const documentText = pdfData.text;

    // Call the existing indexing flow
    const result = await indexMaterial({
      documentText,
      courseId,
      sourceUrl: file.name, // Use the PDF's filename as the source
      userId, // Pass the userId to the flow
    });

    if (result.success) {
      return NextResponse.json({ message: `Successfully indexed ${result.chunksIndexed} chunks from ${file.name}.` });
    } else {
      throw new Error('Indexing flow failed.');
    }

  } catch (error: any) {
    console.error('[API - INDEX PDF]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during PDF indexing.' },
      { status: 500 }
    );
  }
}
