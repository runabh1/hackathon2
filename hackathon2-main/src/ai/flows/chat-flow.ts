
'use server';
/**
 * @fileOverview The main conversational chat flow for MentorAI.
 * This flow is responsible for handling user conversation, maintaining history,
 * and using tools to access other capabilities like RAG, email, etc.
 *
 * - chat - a streaming flow for general conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { recommendLearningResources } from './learning-recommendation-flow';
import { generateCareerInsights } from './career-insights-flow';
import { getRAGAnswer } from '@/lib/rag';
import { listEmailsTool, readEmailTool } from './email-manager';
import {
    ChatInputSchema,
    type ChatInput,
    type ChatMessage,
} from './types';

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
    listEmailsTool,
    readEmailTool
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
    
    // Dynamically add the userId to the context for tools that need it.
    // The AI will then extract it and pass it as an input to the tool.
    const systemPrompt = `**ROLE AND PERSONA:**
You are "The Student Mentor," an AI-Powered Personal Guide, Manager, and Learning Assistant. Your tone is supportive, encouraging, professional, and clear. Your primary goal is to help the user (a student) with academic preparation, resource management, and administrative tasks.

**CONTEXT:**
- The user's ID is: ${input.userId}
- The current course context (if provided) is: ${input.courseId || 'Not specified'}

**CORE DIRECTIVES:**
1.  **Tool/Agent Use (Function Calling):** You have several tools available. You MUST use them when appropriate.
    *   **Study Guide (RAG):** If the user asks a question *specifically about their "notes", "documents", or uploaded "study material"* (e.g., "what do my notes say about mitosis?"), you MUST use the \`getStudyGuideAnswer\` tool. You will need to provide the \`userId\` and the \`courseId\` from the context above.
    *   **General Questions:** For general academic questions (e.g., "what is mitosis?"), career questions, or resource suggestions, use your own knowledge and the appropriate tools like \`generateCareerInsights\` or \`recommendLearningResources\`. DO NOT use the \`getStudyGuideAnswer\` tool for these general questions.
    *   **Email:** If the request involves emails, you MUST use the Gmail tools (\`listEmails\` and \`readEmail\`). You will need to provide the \`userId\` from the context above. First, use \`listEmails\` to find relevant emails. Then, if the user wants to know the content, use \`readEmail\` with the message ID. Finally, summarize the content of the email for the user. Do not show the full email body unless asked.
2.  **Resource Recommendation:** For every general academic question, always include a suggestion for further learning by calling the \`recommendLearningResources\` tool.
3.  **Formatting:** Always use Markdown for clear readability, including bullet points for summaries, bolding for key terms, and section headers.

**INSTRUCTION SET FOR RESPONSE GENERATION:**

* **When using Context from a Tool:** State clearly when the information is from their course material or email. Summarize the content concisely and ensure 100% factual accuracy based on the retrieved text.
    * *Example: "Based on your uploaded materials, the key concept of the RAG pipeline is..."*
    * *Example: "I found an email from your professor about the exam. It says..."*
* **When using a Tool/Function:** If a tool call is successful, use the result returned from the function to construct a helpful, conversational summary for the student. Do not show the raw code or API response.
    * *Example: "I have checked your emails. The latest email states that **all mandatory attendance marks are due by Friday**."*
* **When suggesting resources:** Ensure the resource is highly relevant to the user's specific topic (e.g., if they ask about 'Python lists', suggest a video on 'Python List Comprehensions').
`;

    const { stream, response } = await ai.generateStream({
        model: 'googleai/gemini-2.5-flash',
        system: systemPrompt,
        prompt: input.prompt,
        history: input.history as ChatMessage[],
        tools: tools,
        toolConfig: {
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
