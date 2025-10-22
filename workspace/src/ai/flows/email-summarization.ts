'use server';

/**
 * @fileOverview Summarizes unread emails using a Genkit flow.
 *
 * - summarizeUnreadEmails - A function that summarizes unread emails.
 * - SummarizeUnreadEmailsInput - The input type for the summarizeUnreadEmails function.
 * - SummarizeUnreadEmailsOutput - The return type for the summarizeUnreadEmails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { emailManagerTool } from './email-manager';

const SummarizeUnreadEmailsInputSchema = z.object({
  userId: z.string().describe("The user's ID to fetch emails for."),
});
export type SummarizeUnreadEmailsInput = z.infer<typeof SummarizeUnreadEmailsInputSchema>;

const SummarizeUnreadEmailsOutputSchema = z.object({
  summary: z.string().describe('A summary of the unread emails.'),
});
export type SummarizeUnreadEmailsOutput = z.infer<typeof SummarizeUnreadEmailsOutputSchema>;

export async function summarizeUnreadEmails(input: SummarizeUnreadEmailsInput): Promise<SummarizeUnreadEmailsOutput> {
  return summarizeEmailsFlow(input);
}

const summarizeEmailsFlow = ai.defineFlow(
  {
    name: 'summarizeEmailsFlow',
    inputSchema: SummarizeUnreadEmailsInputSchema,
    outputSchema: SummarizeUnreadEmailsOutputSchema,
  },
  async ({ userId }) => {
    
    // Call the LLM, providing the emailManagerTool. 
    // The LLM will decide to call the tool if it deems it necessary.
    // The tool has the userId and will handle fetching the token and emails.
    const llmResponse = await ai.generate({
      model: 'meta-llama/Llama-2-7b-chat-hf',
      prompt: `Please summarize the user's latest unread emails. If there are no emails, state that. If there's an error, report the error message clearly.`,
      tools: [emailManagerTool],
      toolConfig: {
        // Pass the userId to the tool when the LLM decides to call it.
        emailManagerTool: { userId }
      }
    });

    const summaryText = llmResponse.text;

    return { summary: summaryText };
  }
);
