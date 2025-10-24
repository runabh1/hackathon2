
import { config } from 'dotenv';
config({ path: '.env.local' });
import 'dotenv/config';

// import '@/ai/flows/email-manager.ts';
import '@/ai/flows/attendance-update.ts';
import '@/ai/flows/study-guide-flow.ts';
import '@/ai/flows/learning-recommendation-flow.ts';
import '@/ai/flows/career-insights-flow.ts';
import '@/ai/flows/study-guide-rag-flow.ts';
import '@/ai/flows/index-material-flow.ts';
import '@/ai/flows/chat-flow.ts';
// This file can also contain types, but we'll put them in a separate file for clarity.
import '@/ai/flows/types.ts';
