'use server';
/**
 * @fileOverview An AI agent for recommending learning resources.
 *
 * - recommendLearningResources - A function that recommends resources for a given topic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
    LearningRecommendationInputSchema, 
    LearningRecommendationOutputSchema, 
    type LearningRecommendationInput, 
    type LearningRecommendationOutput 
} from './types';


export async function recommendLearningResources(input: LearningRecommendationInput): Promise<LearningRecommendationOutput> {
  return learningRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'learningRecommendationPrompt',
  input: {schema: LearningRecommendationInputSchema},
  output: {schema: LearningRecommendationOutputSchema},
  prompt: `You are an expert learning assistant AI. Your task is to recommend high-quality, free online resources for a given topic.

For the topic "{{{topic}}}", please provide a list of learning resources. Include:
1.  **YouTube Videos**: A list of 2-3 helpful videos. Format as a markdown list with the title as the link text, e.g., "[Video Title](https://youtube.com/watch?v=...)".
2.  **Google Search Links**: A list of 2-3 pre-filled Google search queries for further reading. Format as a markdown list, e.g., "[Search for key concepts in Topic](https://google.com/search?q=...)".

Format the output clearly with headings for each resource type.
`,
});

const learningRecommendationFlow = ai.defineFlow(
  {
    name: 'learningRecommendationFlow',
    inputSchema: LearningRecommendationInputSchema,
    outputSchema: LearningRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
