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
  return summarizeUnreadEmailsFlow(input);
}

const summarizeEmailsFlow = ai.defineFlow(
  {
    name: 'summarizeEmailsFlow',
    inputSchema: SummarizeUnreadEmailsInputSchema,
    outputSchema: SummarizeUnreadEmailsOutputSchema,
  },
  async ({ userId }) => {
    
    const llmResponse = await ai.generate({
      prompt: `Based on the user's unread emails, provide a concise summary. If there are errors or no emails, state that clearly.`,
      tools: [emailManagerTool],
      toolConfig: {
        // Pass the userId to the tool when the LLM decides to call it.
        emailManagerTool: { userId }
      }
    });

    const toolOutput = llmResponse.toolRequest()?.tool.emailManagerTool.output;
    const textOutput = llmResponse.text;

    // Check if the tool was called and produced output.
    if (toolOutput) {
      if (toolOutput.startsWith('Error:')) {
        return { summary: toolOutput };
      }
       // If the tool ran successfully, we can create a summary from its output.
      const finalSummary = `Here is a summary of your latest unread emails:\n\n${toolOutput}`;
      return { summary: finalSummary };
    }
    
    // If the tool wasn't called but the LLM generated text, use that.
    if(textOutput) {
      return { summary: textOutput };
    }

    // Fallback response
    return { summary: 'I was unable to retrieve your emails at this time. Please ensure your Gmail account is linked and try again.' };
  }
);


const summarizeUnreadEmailsFlow = ai.defineFlow(
  {
    name: 'summarizeUnreadEmailsFlow',
    inputSchema: SummarizeUnreadEmailsInputSchema,
    outputSchema: SummarizeUnreadEmailsOutputSchema,
  },
  async (input) => {
    // This outer flow now simply calls the properly configured inner flow.
    return summarizeEmailsFlow(input);
  }
);
