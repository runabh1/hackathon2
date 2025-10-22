import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import openAI from '@genkit-ai/compat-oai';

const KOMPACT_AI_BASE_URL = 'https://api.kompact.ai/v1';
export const KOMPACT_AI_MODEL_ID = 'kompact-ai-llama-7b';

export const ai = genkit({
  plugins: [
    googleAI(), // Keep googleAI for embedding and other potential tools
    openAI({
      apiKey: process.env.KOMPACT_AI_API_KEY,
      baseUrl: KOMPACT_AI_BASE_URL,
    }),
  ],
  model: openAI.model(KOMPACT_AI_MODEL_ID), // Set Kompact AI as the default model
});
