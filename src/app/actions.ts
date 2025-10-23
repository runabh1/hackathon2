
'use server';

import { chat, type ChatInput } from '@/ai/flows/chat-flow';

export async function runChatFlow(input: ChatInput) {
    // The runFlow wrapper is not needed; the Genkit Next.js plugin
    // automatically handles the streamable response from the flow.
    return chat(input);
}
