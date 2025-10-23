'use server';
/**
 * @fileOverview An AI agent for providing career insights.
 *
 * - generateCareerInsights - A function that generates insights for a specific career field.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
    CareerInsightsInputSchema, 
    CareerInsightsOutputSchema, 
    type CareerInsightsInput, 
    type CareerInsightsOutput 
} from './types';


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
    const {output} = await prompt(input);
    return output!;
  }
);
