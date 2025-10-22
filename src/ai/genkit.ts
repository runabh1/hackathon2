import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import openAI from '@genkit-ai/compat-oai';

// Configuration for an OpenAI-compatible Llama2 model endpoint
const LLAMA_API_BASE_URL = 'https://api-inference.huggingface.co/v1'; // Using Hugging Face endpoint
const LLAMA_2_7B_MODEL_ID = 'meta-llama/Llama-2-7b-chat-hf'; // Standard Hugging Face model ID

export const llamaPlugin = openAI({
    name: 'huggingface',
    apiKey: process.env.LLAMA_API_KEY, // Assumes API key is in this env var
    baseUrl: LLAMA_API_BASE_URL,
    models: [{ name: LLAMA_2_7B_MODEL_ID }],
});

export const ai = genkit({
  plugins: [
    googleAI(), // Keep googleAI for embedding and other potential tools
    llamaPlugin,    // Register the Llama 2 plugin
  ],
  // Flows will explicitly specify the model ID to use.
});
