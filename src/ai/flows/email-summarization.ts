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

const SummarizeUnreadEmailsInputSchema = z.object({
  emailSummaries: z.array(
    z.object({
      sender: z.string().describe('The sender of the email.'),
      subject: z.string().describe('The subject of the email.'),
      body: z.string().describe('The body of the email.'),
    })
  ).describe('A list of email summaries to be summarized.'),
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
  input: {schema: SummarizeUnreadEmailsInputSchema},
  output: {schema: SummarizeUnreadEmailsOutputSchema},
  prompt: `You are an AI assistant helping a student manage their email inbox.
  Summarize the following unread emails to help the student quickly understand the important information and prioritize their responses:

  {{#each emailSummaries}}
  Sender: {{{sender}}}
  Subject: {{{subject}}}
  Body: {{{body}}}
  ---\n  {{/each}}

  Please provide a concise summary of the key information from these emails.`,
});

const summarizeUnreadEmailsFlow = ai.defineFlow(
  {
    name: 'summarizeUnreadEmailsFlow',
    inputSchema: SummarizeUnreadEmailsInputSchema,
    outputSchema: SummarizeUnreadEmailsOutputSchema,
  },
  async input => {
    const {output} = await summarizeUnreadEmailsPrompt(input);
    return output!;
  }
);
