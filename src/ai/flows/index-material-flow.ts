'use server';
/**
 * @fileOverview A flow to process and prepare study materials for indexing.
 * This flow does NOT write to the database. It chunks text and creates embeddings.
 *
 * - indexMaterial - A function that chunks and embeds document text.
 * - IndexMaterialInput - The input type for the indexMaterial function.
 * - IndexMaterialOutput - The output type for the indexMaterial function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Schemas ---
const IndexMaterialInputSchema = z.object({
  documentText: z.string().describe('The raw text content of the study document.'),
});
export type IndexMaterialInput = z.infer<typeof IndexMaterialInputSchema>;

// Define the shape of a single processed chunk
export const ProcessedChunkSchema = z.object({
  chunk_text: z.string(),
  vector_embedding: z.array(z.number()),
});
export type ProcessedChunk = z.infer<typeof ProcessedChunkSchema>;

// The flow will output an array of these processed chunks
const IndexMaterialOutputSchema = z.array(ProcessedChunkSchema);
export type IndexMaterialOutput = z.infer<typeof IndexMaterialOutputSchema>;

// --- Helper Functions ---

/**
 * A simple text chunking function.
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
 */
function createEmbedding(text: string): number[] {
    const embedding = Array(128).fill(0);
    for (let i = 0; i < text.length; i++) {
        embedding[i % 128] += text.charCodeAt(i);
    }
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return embedding;
    return embedding.map(val => val / norm);
}

// --- Main Flow & Exported Function ---

export async function indexMaterial(input: IndexMaterialInput): Promise<IndexMaterialOutput> {
  return indexMaterialFlow(input);
}

const indexMaterialFlow = ai.defineFlow(
  {
    name: 'indexMaterialFlow',
    inputSchema: IndexMaterialInputSchema,
    outputSchema: IndexMaterialOutputSchema,
  },
  async ({ documentText }) => {
    // 1. Chunk the document
    const textChunks = chunkText(documentText);

    // 2. Process each chunk to create embeddings
    const processedChunks = textChunks.map(chunk => {
      const vector_embedding = createEmbedding(chunk);
      return {
        chunk_text: chunk,
        vector_embedding: vector_embedding,
      };
    });

    // 3. Return the array of processed chunks
    return processedChunks;
  }
);
