
'use server';

import { runFlow } from '@genkit-ai/next';
import { chat, type ChatInput } from '@/ai/flows/chat-flow';

export async function runChatFlow(input: ChatInput) {
    return runFlow(chat, input);
}
