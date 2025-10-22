'use server';

import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import openAI from '@genkit-ai/compat-oai';

// Configuration for an OpenAI-compatible Llama2 model endpoint
const LLAMA_API_BASE_URL = 'https://api.example.com/v1'; // Replace with your Llama 2 provider's URL
export const LLAMA_2_7B_MODEL_ID = 'llama-2-7b-chat'; // Replace with the specific model ID from your provider

const llamaPlugin = openAI({
    apiKey: process.env.LLAMA_API_KEY, // Assumes API key is in this env var
    baseUrl: LLAMA_API_BASE_URL,
});

export const ai = genkit({
  plugins: [
    googleAI(), // Keep googleAI for embedding and other potential tools
    llamaPlugin,    // Register the Llama 2 plugin
  ],
  // Flows will explicitly specify the model ID to use.
});

// For backward compatibility if any old constants were imported elsewhere.
export const KOMPACT_AI_MODEL_ID = LLAMA_2_7B_MODEL_ID;