
// src/ai/flows/improve-prompt.ts
'use server';

/**
 * @fileOverview Provides live suggestions for improving image generation prompts.
 *
 * - improvePrompt - A function that suggests improvements to a given prompt.
 * - ImprovePromptInput - The input type for the improvePrompt function.
 * - ImprovePromptOutput - The return type for the improvePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImprovePromptInputSchema = z.object({
  prompt: z.string().describe('The image generation prompt to improve.'),
});
export type ImprovePromptInput = z.infer<typeof ImprovePromptInputSchema>;

const ImprovePromptOutputSchema = z.object({
  improvedPrompt: z.string().describe('The improved image generation prompt.'),
  reasoning: z.string().describe('The reasoning behind the suggested improvements.'),
});
export type ImprovePromptOutput = z.infer<typeof ImprovePromptOutputSchema>;

export async function improvePrompt(input: ImprovePromptInput): Promise<ImprovePromptOutput> {
  return improvePromptFlow(input);
}

const improvePromptPrompt = ai.definePrompt({
  name: 'improvePromptPrompt',
  input: {schema: ImprovePromptInputSchema},
  output: {schema: ImprovePromptOutputSchema},
  prompt: `You are an AI assistant specializing in improving image generation prompts.

  Given the following prompt:
  """{{prompt}}"""

  Suggest an improved prompt that will yield better image generation results.
  Explain your reasoning for the suggested changes.

  Your output should contain the improved prompt and your reasoning.
  `,
});

const improvePromptFlow = ai.defineFlow(
  {
    name: 'improvePromptFlow',
    inputSchema: ImprovePromptInputSchema,
    outputSchema: ImprovePromptOutputSchema,
  },
  async input => {
    if (!process.env.GOOGLE_API_KEY) {
      const errorMessage = 'The GOOGLE_API_KEY environment variable is not set. Please add it to your deployment settings and redeploy.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    try {
        const {output} = await improvePromptPrompt(input);
        return output!;
    } catch (e: any) {
        console.error("Improve prompt API call failed:", e);
        throw new Error("Failed to get suggestion. Please check the following and try again:\n1. Your GOOGLE_API_KEY is correct in your Netlify environment variables.\n2. In your Google Cloud project, the 'Generative Language API' or 'Vertex AI API' is enabled.\n3. Billing is enabled for your Google Cloud project.");
    }
  }
);
