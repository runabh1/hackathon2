// src/app/api/study-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { studyGuideRAG, createQueryEmbedding } from '@/ai/flows/study-guide-rag-flow';
import { getAdminDb } from '@/lib/firebase/tokenService';
import { z } from 'zod';

const RequestBodySchema = z.object({
  query: z.string(),
  courseId: z.string(),
  userId: z.string(),
});

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    return vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
}

/**
 * Simulates a vector search in Firestore.
 */
async function findSimilarChunks(
  query: string,
  courseId: string,
  userId: string
): Promise<{ chunks: string[]; sources: string[] }> {
  const firestore = getAdminDb();
  const queryVector = createQueryEmbedding(query);

  const collectionRef = firestore.collection('study_material_vectors');
  const snapshot = await collectionRef
    .where('course_id', '==', courseId)
    .where('userId', '==', userId) 
    .get();

  if (snapshot.empty) {
    return { chunks: [], sources: [] };
  }

  const similarities: { text: string; source: string, similarity: number }[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const docVector = data.vector_embedding;
    if (Array.isArray(docVector) && docVector.length === queryVector.length) {
        const similarity = cosineSimilarity(queryVector, docVector);
        similarities.push({ text: data.chunk_text, source: data.source_url, similarity });
    }
  });

  similarities.sort((a, b) => b.similarity - a.similarity);
  const topChunks = similarities.slice(0, 3);

  return {
    chunks: topChunks.map(c => c.text),
    sources: [...new Set(topChunks.map(c => c.source))],
  };
}


export async function POST(req: NextRequest) {
  const body = await req.json();

  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { query, courseId, userId } = parsed.data;

  try {
    // 1. Find relevant chunks from Firestore.
    const { chunks, sources } = await findSimilarChunks(query, courseId, userId);

    // 2. Call the RAG flow with the retrieved context.
    const ragResponse = await studyGuideRAG({
        query,
        context: chunks,
    });

    // 3. Send the complete answer and sources back.
    return NextResponse.json({
        answer: ragResponse.answer,
        sources: sources,
    });

  } catch (error: any) {
    console.error('[STUDY CHAT API - RAG]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
