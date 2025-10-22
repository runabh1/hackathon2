// src/app/api/index-material/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { indexMaterial, IndexMaterialInput } from '@/ai/flows/index-material-flow';

export async function POST(req: NextRequest) {
  try {
    const body: IndexMaterialInput = await req.json();

    // Basic validation
    if (!body.documentText || !body.courseId || !body.userId) {
      return NextResponse.json({ error: 'documentText, courseId, and userId are required.' }, { status: 400 });
    }

    const result = await indexMaterial(body);

    if (result.success) {
      return NextResponse.json({ message: `Successfully indexed ${result.chunksIndexed} chunks.` });
    } else {
      throw new Error('Indexing flow failed.');
    }
  } catch (error: any) {
    console.error('[API - INDEX MATERIAL]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during indexing.' },
      { status: 500 }
    );
  }
}
