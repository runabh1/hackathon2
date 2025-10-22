import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/ai/flows/email-manager.ts';
import '@/ai/flows/attendance-update.ts';
import '@/ai/flows/study-guide-flow.ts';
