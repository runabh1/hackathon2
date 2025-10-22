'use server';
/**
 * @fileOverview A flow to index study materials for the RAG system.
 *
 * - indexMaterial - A function that chunks, embeds, and stores document text in Firestore.
 * - IndexMaterialInput - The input type for the indexMaterial function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAdminDb } from '@/lib/firebase/tokenService';

// --- Schemas ---
const IndexMaterialInputSchema = z.object({
  courseId: z.string().describe('The ID for the course, e.g., "CHEM-101".'),
  documentText: z.string().describe('The raw text content of the study document.'),
  sourceUrl: z.string().url().or(z.string()).describe('The URL or filename where the original document can be found.'),
});
export type IndexMaterialInput = z.infer<typeof IndexMaterialInputSchema>;

// --- Helper Functions ---

/**
 * A simple text chunking function.
 * In a real application, this would be more sophisticated.
 */
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

/**
 * Generates a mock vector embedding.
 * In a real application, this would call an actual embedding model.
 */
function createEmbedding(text: string): number[] {
    // This is a placeholder. A real implementation would use an embedding model.
    // For now, create a simple vector based on character codes.
    const embedding = Array(128).fill(0);
    for (let i = 0; i < text.length; i++) {
        embedding[i % 128] += text.charCodeAt(i);
    }
    // Normalize the vector to have a magnitude of 1 (unit vector)
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    // Avoid division by zero
    if (norm === 0) return embedding;
    return embedding.map(val => val / norm);
}


// --- Main Flow & Exported Function ---

export async function indexMaterial(input: IndexMaterialInput): Promise<{ success: boolean; chunksIndexed: number }> {
  return indexMaterialFlow(input);
}

const indexMaterialFlow = ai.defineFlow(
  {
    name: 'indexMaterialFlow',
    inputSchema: IndexMaterialInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      chunksIndexed: z.number(),
    }),
  },
  async (input) => {
    const firestore = getAdminDb();
    const { courseId, documentText, sourceUrl } = input;

    // 1. Chunk the document
    const textChunks = chunkText(documentText);
    const collectionRef = firestore.collection('study_material_vectors');
    const batch = firestore.batch();

    // 2. Process each chunk
    for (const chunk of textChunks) {
      // 3. Generate a vector embedding for the chunk
      const vector_embedding = createEmbedding(chunk);

      // 4. Prepare the document for Firestore
      const docRef = collectionRef.doc(); // Auto-generate ID
      batch.set(docRef, {
        chunk_text: chunk,
        vector_embedding: vector_embedding,
        source_url: sourceUrl,
        course_id: courseId,
        createdAt: new Date(),
      });
    }

    // 5. Commit the batch to Firestore
    await batch.commit();

    return {
      success: true,
      chunksIndexed: textChunks.length,
    };
  }
);
