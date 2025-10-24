
'use server';

import { chat } from '@/ai/flows/chat-flow';
import type { ChatInput } from '@/ai/flows/types';

export async function runChatFlow(input: ChatInput) {
    // The Genkit Next.js plugin automatically handles
    // the streamable response from the flow.
    return chat(input);
}
