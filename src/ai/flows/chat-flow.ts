
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
import { emailManagerTool } from './email-manager';

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

// Input/Output types for other flows, consolidated here
// to avoid exporting types from 'use server' files.
export type { CareerInsightsInput, CareerInsightsOutput } from './career-insights-flow';
export type { LearningRecommendationInput, LearningRecommendationOutput } from './learning-recommendation-flow';
export type { StudyGuideRAGInput, StudyGuideRAGOutput } from './study-guide-rag-flow';


const getRAGAnswerTool = ai.defineTool(
    {
      name: 'getStudyGuideAnswer',
      description: 'Answers questions by searching through the user\'s uploaded study materials for a specific course. Use this ONLY when the user explicitly asks about their "notes", "documents", or "study material". For general academic questions, use your own knowledge.',
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


const tools = [
    getRAGAnswerTool,
    recommendLearningResourcesTool,
    generateCareerInsightsTool,
    emailManagerTool,
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
        if (tool.name === 'emailManagerTool' || tool.name === 'getStudyGuideAnswer') {
            return {
                ...tool,
                // Provide the userId directly to the tool's context
                context: { userId: input.userId, courseId: input.courseId } 
            };
        }
        return tool;
    });

    const llm = ai.getModel('gemini-1.5-flash-latest');
    
    const { stream, response } = await llm.generateStream({
        system: `**ROLE AND PERSONA:**
You are "The Student Mentor," an AI-Powered Personal Guide, Manager, and Learning Assistant. Your tone is supportive, encouraging, professional, and clear. Your primary goal is to help the user (a student) with academic preparation, resource management, and administrative tasks.

**CORE DIRECTIVES:**
1.  **Tool/Agent Use (Function Calling):** You have several tools available. You MUST use them when appropriate.
    *   **Study Guide (RAG):** If the user asks a question *specifically about their "notes", "documents", or uploaded "study material"* (e.g., "what do my notes say about mitosis?"), you MUST use the \`getStudyGuideAnswer\` tool.
    *   **General Questions:** For general academic questions (e.g., "what is mitosis?"), career questions, or resource suggestions, use your own knowledge and the appropriate tools like \`generateCareerInsights\` or \`recommendLearningResources\`. DO NOT use the \`getStudyGuideAnswer\` tool for these general questions.
    *   **Email:** If the request involves emails, use the \`emailManagerTool\`.
2.  **Resource Recommendation:** For every general academic question, always include a suggestion for further learning by calling the \`recommendLearningResources\` tool.
3.  **Formatting:** Always use Markdown for clear readability, including bullet points for summaries, bolding for key terms, and section headers.

**INSTRUCTION SET FOR RESPONSE GENERATION:**

* **When using Context from a Tool:** State clearly when the information is from their course material. Summarize the content concisely and ensure 100% factual accuracy based on the retrieved text.
    * *Example: "Based on your uploaded materials, the key concept of the RAG pipeline is..."*
* **When using a Tool/Function:** If a tool call is successful, use the result returned from the function to construct a helpful, conversational summary for the student. Do not show the raw code or API response.
    * *Example: "I have checked your emails. The latest email states that **all mandatory attendance marks are due by Friday**."*
* **When suggesting resources:** Ensure the resource is highly relevant to the user's specific topic (e.g., if they ask about 'Python lists', suggest a video on 'Python List Comprehensions').
`,
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
