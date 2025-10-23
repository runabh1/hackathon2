
'use server';
/**
 * @fileOverview A flow for chunking and embedding text material.
 * This flow does NOT interact with the database. It only performs data transformation.
 *
 * - indexMaterial - The main function that chunks and embeds text.
 * - IndexMaterialInput - The input type for the function.
 * - IndexMaterialOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Schemas ---
const IndexMaterialInputSchema = z.object({
  text: z.string().describe("The raw text content to be indexed."),
  courseId: z.string(),
  userId: z.string(),
});
export type IndexMaterialInput = z.infer<typeof IndexMaterialInputSchema>;

const VectorSchema = z.object({
    text: z.string(),
    embedding: z.array(z.number()),
    courseId: z.string(),
    userId: z.string(),
});

const IndexMaterialOutputSchema = z.object({
  vectors: z.array(VectorSchema).describe("An array of text chunks and their corresponding vector embeddings."),
});
export type IndexMaterialOutput = z.infer<typeof IndexMaterialOutputSchema>;


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
  async ({ text, courseId, userId }) => {
    // 1. Chunk the document text (simple, deterministic chunker)
    function chunkText(text: string, size = 500, overlap = 50) {
      const words = text.split(/\s+/).filter(Boolean);
      const chunks: { text: string }[] = [];
      let i = 0;
      while (i < words.length) {
        const slice = words.slice(i, i + size);
        chunks.push({ text: slice.join(' ') });
        i += size - overlap;
      }
      return chunks;
    }

    const chunks = chunkText(text, 500, 50);

    if (!chunks || chunks.length === 0) {
      return { vectors: [] };
    }

    // 2. Embed the chunks
    // The genkit typings are strict about embedder params. Use a local any-cast
    // to call the runtime API and accept the returned shape.
    // @ts-ignore
    const embeddings: any = await (ai as any).embed({
      content: chunks.map((c) => c.text),
    });

    // 3. Combine chunks with their embeddings and metadata
    const vectors = chunks.map((chunk: { text: string }, i: number) => ({
      text: chunk.text,
      embedding: Array.isArray(embeddings[i]) ? embeddings[i] : embeddings[i]?.embedding ?? embeddings[i],
      courseId,
      userId,
    }));

    return { vectors };
  }
);
