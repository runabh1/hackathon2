// src/lib/rag.ts
import 'dotenv/config';
import { getAdminDb } from '@/lib/firebase/admin';
import { ai } from '@/ai/genkit';
import { studyGuideRAG } from '@/ai/flows/study-guide-rag-flow';

/**
 * Calculates the dot product of two vectors.
 */
function dotProduct(vecA: number[], vecB: number[]): number {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

/**
 * Calculates the magnitude of a vector.
 */
function magnitude(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Calculates the cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  const dot = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) {
    return 0;
  }
  return dot / (magA * magB);
}

/**
 * Finds the most relevant text chunks from Firestore based on a user's query.
 * @param query - The user's question.
 * @param courseId - The course to search within.
 * @param userId - The user's ID.
 * @returns An array of the most relevant text chunks.
 */
export async function findSimilarDocuments(query: string, courseId: string, userId: string): Promise<string[]> {
  try {
    const db = getAdminDb();
    
    // 1. Embed the user's query
    const [queryEmbedding] = await ai.embed({
      content: [query],
    });

    // 2. Fetch all vectors for the given course and user
    const vectorsSnapshot = await db.collection('study_material_vectors')
      .where('courseId', '==', courseId)
      .where('userId', '==', userId)
      .get();
      
    if (vectorsSnapshot.empty) {
      return [];
    }

    // 3. Calculate cosine similarity for each document
    const documents = vectorsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        text: data.text,
        similarity: cosineSimilarity(queryEmbedding, data.embedding),
      };
    });

    // 4. Sort by similarity and take the top N results
    const topN = documents.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
    
    // 5. Return just the text content
    return topN.map(doc => doc.text);

  } catch (error) {
    console.error("Error in findSimilarDocuments:", error);
    // Return empty array on error to prevent crashing the main flow
    return [];
  }
}

/**
 * The main orchestrator for the RAG process.
 * It finds relevant documents and then calls the study guide flow.
 * @param query - The user's question.
 * @param courseId - The course to search within.
 * @param userId - The user's ID.
 * @returns The AI-generated answer and the sources used.
 */
export async function getRAGAnswer(query: string, courseId: string, userId: string): Promise<{ answer: string; sources: string[] }> {
  try {
    // Find relevant context
    const contextChunks = await findSimilarDocuments(query, courseId, userId);
    
    // If no context is found, return a specific message.
    if (contextChunks.length === 0) {
        return {
            answer: "I couldn't find any study materials related to your question for this course. Please make sure you've uploaded documents for this course ID.",
            sources: []
        };
    }

    // Call the RAG flow with the context
    const ragResult = await studyGuideRAG({
      query,
      context: contextChunks,
    });
    
    // The sources are the chunks of text we provided as context
    const sources = contextChunks.map(chunk => chunk.substring(0, 100) + '...');
    
    return {
      answer: ragResult.answer,
      sources,
    };
  } catch (error) {
    console.error("Critical error in getRAGAnswer:", error);
    throw new Error("Failed to generate an answer due to an internal error.");
  }
}
