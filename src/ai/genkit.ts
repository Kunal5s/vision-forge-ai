/**
 * @fileoverview This file initializes and configures the Genkit AI toolkit.
 * It sets up the Google AI plugin with the necessary API key.
 * This centralized setup allows other parts of the application to import and use the
 * configured `ai` object for generative tasks without re-initializing it.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// The API key is automatically sourced from the GEMINI_API_KEY environment variable.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // We can enable logging for debugging on the server side if needed.
  // Set to 'info' or 'debug' for more verbose output.
  logLevel: 'silent', 
});
