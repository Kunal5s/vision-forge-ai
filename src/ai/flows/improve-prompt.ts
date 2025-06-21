
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
  error: z.string().optional().describe('An error message if the suggestion failed.'),
});
export type ImprovePromptOutput = z.infer<typeof ImprovePromptOutputSchema>;

export async function improvePrompt(input: ImprovePromptInput): Promise<ImprovePromptOutput> {
  return improvePromptFlow(input);
}

const improvePromptPrompt = ai.definePrompt({
  name: 'improvePromptPrompt',
  input: {schema: ImprovePromptInputSchema},
  output: {schema: z.object({
      improvedPrompt: z.string().describe('The improved image generation prompt.'),
      reasoning: z.string().describe('The reasoning behind the suggested improvements.'),
  })},
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
  async (input): Promise<ImprovePromptOutput> => {
    try {
        const {output} = await improvePromptPrompt(input);
        if (!output?.improvedPrompt) {
            const failureReason = "The AI could not generate a suggestion. This might be due to a safety policy violation or a problem with your Google Cloud project configuration. Please check the following and try again:\n\n1. **Billing is enabled** for your Google Cloud project.\n2. The **'Generative Language API'** is enabled.\n3. Your prompt does not violate safety policies.";
            return { improvedPrompt: '', reasoning: '', error: failureReason };
        }
        return {
            improvedPrompt: output.improvedPrompt,
            reasoning: output.reasoning,
        };
    } catch (e: any) {
        console.error("Improve prompt API call failed:", e);
        const detailedMessage = "An unexpected error occurred. This is often caused by an incorrect API Key or Google Cloud project setup. Please check the following:\n\n1. Your **GOOGLE_API_KEY** is correct in your Netlify environment variables.\n2. **Billing is enabled** for your Google Cloud project.\n3. The **'Generative Language API'** (or Vertex AI) is enabled in Google Cloud.";
        return { improvedPrompt: '', reasoning: '', error: detailedMessage };
    }
  }
);
