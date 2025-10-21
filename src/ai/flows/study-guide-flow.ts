'use server';
/**
 * @fileOverview A study guide generation AI agent.
 *
 * - generateContextAwareStudyGuide - A function that handles the study guide generation process.
 * - StudyGuideInput - The input type for the generateContextAwareStudyGuide function.
 * - StudyGuideOutput - The return type for the generateContextAwareStudyGuide function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyGuideInputSchema = z.object({
  query: z.string().describe('The query for exam preparation assistance.'),
});
export type StudyGuideInput = z.infer<typeof StudyGuideInputSchema>;

const StudyGuideOutputSchema = z.object({
  answer: z.string().describe('The context-aware answer for exam preparation.'),
});
export type StudyGuideOutput = z.infer<typeof StudyGuideOutputSchema>;

export async function generateContextAwareStudyGuide(input: StudyGuideInput): Promise<StudyGuideOutput> {
  return studyGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studyGuidePrompt',
  input: {schema: StudyGuideInputSchema},
  output: {schema: StudyGuideOutputSchema},
  prompt: `You are an expert study guide generator. Use the provided context to answer the student's question.

Question: {{{query}}}
`,
});

const studyGuideFlow = ai.defineFlow(
  {
    name: 'studyGuideFlow',
    inputSchema: StudyGuideInputSchema,
    outputSchema: StudyGuideOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
