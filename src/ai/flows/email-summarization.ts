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

const summarizeUnreadEmailsPrompt = ai.definePrompt({
  name: 'summarizeUnreadEmailsPrompt',
  input: {schema: z.object({
    emailSummary: z.string(),
  })},
  output: {schema: SummarizeUnreadEmailsOutputSchema},
  prompt: `You are an AI assistant helping a student manage their email inbox.
  Summarize the following unread emails to help the student quickly understand the important information and prioritize their responses:

  {{{emailSummary}}}

  Please provide a concise summary of the key information from these emails.`,
});

const summarizeUnreadEmailsFlow = ai.defineFlow(
  {
    name: 'summarizeUnreadEmailsFlow',
    inputSchema: SummarizeUnreadEmailsInputSchema,
    outputSchema: SummarizeUnreadEmailsOutputSchema,
    tools: [emailManagerTool]
  },
  async (input) => {
    const llmResponse = await ai.generate({
        prompt: `Summarize the user's unread emails.`,
        tools: [emailManagerTool],
        toolConfig: {
          emailManagerTool: {
            userId: input.userId
          }
        }
    });

    const toolResponse = llmResponse.toolRequest()?.tool.emailManagerTool;

    if (!toolResponse) {
      return { summary: "Could not retrieve emails. The user may need to link their Gmail account." };
    }
    
    const summary = toolResponse.output;

    if (!summary || summary.startsWith('Error')) {
      return { summary: summary || "An unknown error occurred while fetching emails." };
    }
    
    const { output } = await summarizeUnreadEmailsPrompt({ emailSummary: summary });

    return output!;
  }
);
