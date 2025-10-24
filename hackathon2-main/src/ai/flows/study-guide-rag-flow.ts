
'use server';
/**
 * @fileOverview The core RAG flow for answering study questions.
 * This flow now takes context as an argument and does not access the database.
 *
 * - studyGuideRAG - The main RAG flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    StudyGuideRAGInputSchema, 
    StudyGuideRAGOutputSchema,
    type StudyGuideRAGInput, 
    type StudyGuideRAGOutput 
} from './types';


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
      config: { temperature: 0.1 },
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
    const { output } = await ragPrompt(input, { model: 'googleai/gemini-2.5-flash' });

    if (!output) {
        throw new Error("Failed to get a response from the AI model.");
    }

    return {
      answer: output.answer,
    };
  }
);
