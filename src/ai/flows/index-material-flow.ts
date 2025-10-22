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
    // 1. Chunk the document text
    const chunks = await ai.chunk({
        text,
        config: {
            chunking: {
                // A simple chunking strategy
                // In a real app, you might choose a more sophisticated method
                unit: "word",
                size: 500, 
                overlap: 50
            }
        }
    });
    
    // 2. Embed the chunks
    const embeddings = await ai.embed({
      content: chunks,
    });

    // 3. Combine chunks with their embeddings and metadata
    const vectors = chunks.map((chunk, i) => ({
      text: chunk.text,
      embedding: embeddings[i],
      courseId,
      userId,
    }));

    return { vectors };
  }
);
