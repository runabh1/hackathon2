'use server';
/**
 * @fileOverview The core RAG flow for answering study questions.
 *
 * - studyGuideRAG - The main RAG flow function.
 * - StudyGuideRAGInput - The input type for the function.
 * - StudyGuideRAGOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/tokenService';

// --- Schemas ---
export const StudyGuideRAGInputSchema = z.object({
  query: z.string().describe('The student\'s question.'),
  courseId: z.string().describe('The course context, e.g., "CHEM-101".'),
});
export type StudyGuideRAGInput = z.infer<typeof StudyGuideRAGInputSchema>;

export const StudyGuideRAGOutputSchema = z.object({
  answer: z.string().describe('The context-aware answer.'),
  sources: z.array(z.string().url()).describe('A list of source URLs used for the answer.'),
});
export type StudyGuideRAGOutput = z.infer<typeof StudyGuideRAGOutputSchema>;


// --- Helper Functions ---

/**
 * Generates a mock vector embedding for the query.
 */
function generateMockEmbedding(text: string): number[] {
    const embedding = Array(128).fill(0);
    for (let i = 0; i < text.length; i++) {
        embedding[i % 128] += text.charCodeAt(i);
    }
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
}

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }
    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Simulates a vector search in Firestore.
 * In a real-world scenario, you would use a dedicated vector database like Pinecone,
 * or a Firestore extension like `pgvector`.
 */
async function findSimilarChunks(
  firestore: FirebaseFirestore.Firestore,
  query: string,
  courseId: string
): Promise<{ chunks: string[]; sources: string[] }> {
  const queryVector = generateMockEmbedding(query);

  const collectionRef = firestore.collection('study_material_vectors');
  const snapshot = await collectionRef.where('course_id', '==', courseId).get();

  if (snapshot.empty) {
    return { chunks: [], sources: [] };
  }

  const similarities: { text: string; source: string, similarity: number }[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const docVector = data.vector_embedding;
    if (Array.isArray(docVector)) {
        const similarity = cosineSimilarity(queryVector, docVector);
        similarities.push({ text: data.chunk_text, source: data.source_url, similarity });
    }
  });

  // Sort by similarity and take the top 3
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topChunks = similarities.slice(0, 3);

  return {
    chunks: topChunks.map(c => c.text),
    sources: [...new Set(topChunks.map(c => c.source))], // Unique sources
  };
}

// --- Main Flow & Exported Function ---

const ragPrompt = ai.definePrompt(
    {
      name: 'studyGuideRAGPrompt',
      input: { schema: z.object({ query: z.string(), context: z.array(z.string()) }) },
      output: { schema: StudyGuideRAGOutputSchema.pick({ answer: true }) }, // Only ask the LLM for the answer part
      prompt: `You are an expert study assistant. Your role is to provide clear, concise, and accurate answers based *only* on the context provided.
  
      CONTEXT:
      ---
      {{#each context}}
      {{this}}
      ---
      {{/each}}
  
      QUESTION:
      "{{query}}"
  
      Based on the context above, answer the user's question. If the context does not contain the answer, state that you cannot answer based on the provided materials. Do not use any outside knowledge.`,
    },
);

export async function studyGuideRAG(input: StudyGuideRAGInput): Promise<StudyGuideRAGOutput> {
  return studyGuideRAGFlow(input);
}

const studyGuideRAGFlow = ai.defineFlow(
  {
    name: 'studyGuideRAGFlow',
    inputSchema: StudyGuideRAGInputSchema,
    outputSchema: StudyGuideRAGOutputSchema,
  },
  async (input) => {
    const firestore = getAdminDb();

    // 1. Find relevant chunks from our "vector store"
    const { chunks, sources } = await findSimilarChunks(firestore, input.query, input.courseId);

    // If no context is found, return a helpful message.
    if (chunks.length === 0) {
      return {
        answer: `I could not find any relevant study materials for the course "${input.courseId}" to answer your question. Please make sure materials have been indexed.`,
        sources: [],
      };
    }

    // 2. Call the LLM with the augmented prompt
    const llmResponse = await ragPrompt({
      query: input.query,
      context: chunks,
    });
    
    const output = llmResponse.output;

    if (!output) {
        throw new Error("Failed to get a response from the AI model.");
    }

    // 3. Combine the LLM answer with the sources and return
    return {
      answer: output.answer,
      sources: sources,
    };
  }
);
