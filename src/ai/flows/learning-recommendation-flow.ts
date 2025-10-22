'use server';
/**
 * @fileOverview An AI agent for recommending learning resources.
 *
 * - recommendLearningResources - A function that recommends resources for a given topic.
 * - LearningRecommendationInput - The input for the recommendLearningResources function.
 * - LearningRecommendationOutput - The return type for the recommendLearningResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LearningRecommendationInputSchema = z.object({
  topic: z.string().describe('The topic for which to recommend learning resources, e.g., "Quantum Computing".'),
});
export type LearningRecommendationInput = z.infer<typeof LearningRecommendationInputSchema>;

const LearningRecommendationOutputSchema = z.object({
  recommendations: z.string().describe('A formatted list of learning resources including articles, videos, and tutorials.'),
});
export type LearningRecommendationOutput = z.infer<typeof LearningRecommendationOutputSchema>;

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
    const {output} = await ai.generate({
        model: 'gemini-1.5-flash-latest',
        prompt: await prompt.render(input),
    });
    return output!;
  }
);
