'use server';
/**
 * @fileOverview An AI agent for providing career insights.
 *
 * - generateCareerInsights - A function that generates insights for a specific career field.
 * - CareerInsightsInput - The input type for the generateCareerInsights function.
 * - CareerInsightsOutput - The return type for the generateCareerInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CareerInsightsInputSchema = z.object({
  field: z.string().describe('The career field to get insights for, e.g., "software engineering".'),
});
export type CareerInsightsInput = z.infer<typeof CareerInsightsInputSchema>;

const CareerInsightsOutputSchema = z.object({
  insights: z.string().describe('A summary of current trends, in-demand skills, and potential career paths for the specified field.'),
});
export type CareerInsightsOutput = z.infer<typeof CareerInsightsOutputSchema>;

export async function generateCareerInsights(input: CareerInsightsInput): Promise<CareerInsightsOutput> {
  return careerInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'careerInsightsPrompt',
  input: {schema: CareerInsightsInputSchema},
  output: {schema: CareerInsightsOutputSchema},
  prompt: `You are a career advisor AI. Your goal is to provide up-to-date and relevant career insights for students.

Generate a summary of the latest trends, in-demand skills, and potential career paths for the following field: {{{field}}}.

Structure your response in clear, easy-to-digest sections.
`,
});

const careerInsightsFlow = ai.defineFlow(
  {
    name: 'careerInsightsFlow',
    inputSchema: CareerInsightsInputSchema,
    outputSchema: CareerInsightsOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
        model: 'gemini-1.5-flash-latest',
        prompt: await prompt.render(input),
    });
    return output!;
  }
);
