'use server';

import {genkit} from 'genkit';
import {googleAI} from 'genkit/plugins/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The API key is read from the GOOGLE_API_KEY environment variable by default.
      // It's recommended to set this in your deployment environment.
    }),
  ],
});
