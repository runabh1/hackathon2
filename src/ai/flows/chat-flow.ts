
'use server';
/**
 * @fileOverview The main conversational chat flow for MentorAI.
 * This flow is responsible for handling user conversation, maintaining history,
 * and using tools to access other capabilities like RAG, email, etc.
 *
 * - chat - A streaming flow for general conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatHistory - The message history type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { recommendLearningResources } from './learning-recommendation-flow';
import { generateCareerInsights } from './career-insights-flow';
import { getRAGAnswer } from '@/lib/rag';
import { summarizeUnreadEmails } from './email-summarization';

// Define the schema for a single message in the chat history
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

// Define the input schema for the main chat flow
export const ChatInputSchema = z.object({
  userId: z.string(),
  courseId: z.string().optional().describe("The course ID if the user's query is course-specific, e.g., 'BIO-101'. The tool should infer this from the conversation."),
  history: z.array(ChatMessageSchema),
  prompt: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


const getRAGAnswerTool = ai.defineTool(
    {
      name: 'getStudyGuideAnswer',
      description: 'Answers student questions about a specific course using their uploaded study materials. Use this if the question is academic and mentions a course ID (e.g., "explain mitosis in BIO-101").',
      inputSchema: z.object({
        query: z.string(),
        courseId: z.string(),
        userId: z.string(),
      }),
      outputSchema: z.object({
        answer: z.string(),
        sources: z.array(z.string()),
      }),
    },
    async ({ query, courseId, userId }) => getRAGAnswer(query, courseId, userId)
);

const recommendLearningResourcesTool = ai.defineTool(
    {
        name: 'recommendLearningResources',
        description: 'Recommends learning resources like articles and videos for a given topic.',
        inputSchema: z.object({ topic: z.string() }),
        outputSchema: z.object({ recommendations: z.string() }),
    },
    async (input) => recommendLearningResources(input)
);

const generateCareerInsightsTool = ai.defineTool(
    {
        name: 'generateCareerInsights',
        description: 'Provides a summary of trends, skills, and career paths for a specific field.',
        inputSchema: z.object({ field: z.string() }),
        outputSchema: z.object({ insights: z.string() }),
    },
    async (input) => generateCareerInsights(input)
);

const summarizeUnreadEmailsTool = ai.defineTool(
    {
        name: 'summarizeUnreadEmails',
        description: "Summarizes the user's latest unread emails.",
        inputSchema: z.object({ userId: z.string() }),
        outputSchema: z.object({ summary: z.string() }),
    },
    async (input) => summarizeUnreadEmails(input)
);


const tools = [
    getRAGAnswerTool,
    recommendLearningResourcesTool,
    generateCareerInsightsTool,
    summarizeUnreadEmailsTool,
];

// The main, streaming chat flow
export const chat = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(), // The final output is just the text response
    streamSchema: z.string(), // What we stream back to the client
  },
  async (input, streamingCallback) => {
    
    // Determine which tools are available based on the input.
    // This allows us to dynamically pass the userId to the tools that need it.
    const availableTools = tools.map(tool => {
        if (tool.name === 'summarizeUnreadEmails' || tool.name === 'getStudyGuideAnswer') {
            return {
                ...tool,
                // Provide the userId directly to the tool's context
                context: { userId: input.userId, courseId: input.courseId } 
            };
        }
        return tool;
    });

    const llm = ai.getModel('gemini-1.5-flash-latest');
    
    const { stream, response } = llm.generateStream({
        prompt: input.prompt,
        history: input.history,
        tools: availableTools,
        toolConfig: {
            // Configure the tool to automatically call the provided functions
            autoToolInference: true,
        }
    });

    // Stream the response chunks back to the client
    for await (const chunk of stream) {
      if (chunk.text) {
        streamingCallback(chunk.text);
      }
    }
    
    // Return the final, complete response
    const finalResponse = await response;
    return finalResponse.text ?? '';
  }
);
