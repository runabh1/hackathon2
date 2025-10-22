// src/app/api/study-chat/route.ts
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { getRAGAnswer } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const { query, courseId, userId } = await req.json();

    if (!query || !courseId || !userId) {
      return NextResponse.json({ error: 'Missing required fields: query, courseId, and userId' }, { status: 400 });
    }

    const result = await getRAGAnswer(query, courseId, userId);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[CRITICAL] /api/study-chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
