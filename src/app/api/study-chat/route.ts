// src/app/api/study-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { studyGuideRAG, StudyGuideRAGInputSchema } from '@/ai/flows/study-guide-rag-flow';
import { StreamingTextResponse, GenkitStream } from 'genkit/next';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate the request body
  const parsed = StudyGuideRAGInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    // For RAG, we want the full response, not a stream, so we can include sources.
    // Streaming would be more complex as we'd need to send sources separately.
    const ragResponse = await studyGuideRAG(parsed.data);

    // Send the complete answer and sources back as a single JSON object.
    return NextResponse.json(ragResponse);

  } catch (error: any) {
    console.error('[STUDY CHAT API]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
