'use server';
/**
 * @fileOverview The core RAG flow for answering study questions.
 * This flow now takes context as an argument and does not access the database.
 *
 * - studyGuideRAG - The main RAG flow function.
 * - StudyGuideRAGInput - The input type for the function.
 * - StudyGuideRAGOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Schemas ---
export const StudyGuideRAGInputSchema = z.object({
  query: z.string().describe("The student's question."),
  context: z.array(z.string()).describe("A list of relevant text chunks from study materials.")
});
export type StudyGuideRAGInput = z.infer<typeof StudyGuideRAGInputSchema>;

export const StudyGuideRAGOutputSchema = z.object({
  answer: z.string().describe('The context-aware answer.'),
});
export type StudyGuideRAGOutput = z.infer<typeof StudyGuideRAGOutputSchema>;


// --- Main Flow & Exported Function ---

const ragPrompt = ai.definePrompt(
    {
      name: 'studyGuideRAGPrompt',
      input: { schema: StudyGuideRAGInputSchema },
      output: { schema: z.object({ answer: z.string() }) },
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

    // If no context is provided, return a helpful message.
    if (input.context.length === 0) {
      return {
        answer: "I could not find any relevant study materials to answer your question. Please make sure you have indexed materials for this course.",
      };
    }

    // Call the LLM with the augmented prompt
    const llmResponse = await ai.generate({
        model: 'gemini-1.5-flash-latest',
        prompt: await ragPrompt.render(input),
        config: { temperature: 0.1 },
    });
    
    const output = llmResponse.output();

    if (!output) {
        throw new Error("Failed to get a response from the AI model.");
    }

    return {
      answer: output.answer,
    };
  }
);
