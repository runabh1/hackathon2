// src/app/api/study-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { studyGuideRAG, StudyGuideRAGInputSchema } from '@/ai/flows/study-guide-rag-flow';

// This configuration is optional, but recommended for Genkit streaming
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate the request body against the Zod schema
  const parsed = StudyGuideRAGInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    // For RAG, we want the full response, not a stream, so we can include sources.
    // The user experience is better if we show the answer and sources at the same time.
    const ragResponse = await studyGuideRAG(parsed.data);

    // Send the complete answer and sources back as a single JSON object.
    return NextResponse.json(ragResponse);

  } catch (error: any) {
    console.error('[STUDY CHAT API - RAG]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
