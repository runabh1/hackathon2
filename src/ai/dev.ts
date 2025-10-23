
import { config } from 'dotenv';
config({ path: '.env.local' });
import 'dotenv/config';

import '@/ai/flows/email-manager';
import '@/ai/flows/attendance-update';
import '@/ai/flows/study-guide-flow';
import '@/ai/flows/learning-recommendation-flow';
import '@/ai/flows/career-insights-flow';
import '@/ai/flows/study-guide-rag-flow';
import '@/ai/flows/index-material-flow';
import '@/ai/flows/chat-flow';
// This file can also contain types, but we'll put them in a separate file for clarity.
import '@/ai/flows/types';
