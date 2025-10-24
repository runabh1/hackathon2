// src/ai/flows/types.ts

import { z } from 'zod';

// --- Chat Flow Types ---

// Schema for a single message in the chat history
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(
    z.object({
      text: z.string().optional(),
      toolRequest: z.any().optional(),
      toolResponse: z.any().optional(),
    })
  ),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Input schema for the main chat flow
export const ChatInputSchema = z.object({
  userId: z.string(),
  courseId: z.string().optional().describe("The course ID if the user's query is course-specific, e.g., 'BIO-101'. The tool should infer this from the conversation."),
  history: z.array(ChatMessageSchema),
  prompt: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


// --- Career Insights Flow Types ---

export const CareerInsightsInputSchema = z.object({
  field: z.string().describe('The career field to get insights for, e.g., "software engineering".'),
});
export type CareerInsightsInput = z.infer<typeof CareerInsightsInputSchema>;

export const CareerInsightsOutputSchema = z.object({
  insights: z.string().describe('A summary of current trends, in-demand skills, and potential career paths for the specified field.'),
});
export type CareerInsightsOutput = z.infer<typeof CareerInsightsOutputSchema>;


// --- Learning Recommendation Flow Types ---

export const LearningRecommendationInputSchema = z.object({
  topic: z.string().describe('The topic for which to recommend learning resources, e.g., "Quantum Computing".'),
});
export type LearningRecommendationInput = z.infer<typeof LearningRecommendationInputSchema>;

export const LearningRecommendationOutputSchema = z.object({
  recommendations: z.string().describe('A formatted list of learning resources including articles, videos, and tutorials.'),
});
export type LearningRecommendationOutput = z.infer<typeof LearningRecommendationOutputSchema>;


// --- RAG Flow Types ---

export const StudyGuideRAGInputSchema = z.object({
    query: z.string().describe("The student's question."),
    context: z.array(z.string()).describe("A list of relevant text chunks from study materials.")
});
export type StudyGuideRAGInput = z.infer<typeof StudyGuideRAGInputSchema>;
  
export const StudyGuideRAGOutputSchema = z.object({
    answer: z.string().describe('The context-aware answer.'),
});
export type StudyGuideRAGOutput = z.infer<typeof StudyGuideRAGOutputSchema>;