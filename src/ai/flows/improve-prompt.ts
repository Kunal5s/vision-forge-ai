
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
    if (!process.env.GOOGLE_API_KEY) {
      const errorMsg = "The site administrator has not configured the GOOGLE_API_KEY. This is required for premium features. Please add it to your deployment environment's settings (e.g., in Cloudflare, Vercel, or Netlify) to enable premium models.";
      console.error(errorMsg);
      return { improvedPrompt: '', reasoning: '', error: errorMsg };
    }

    try {
        const {output} = await improvePromptPrompt(input);
        if (!output?.improvedPrompt) {
            const failureReason = "The AI could not generate a suggestion. This could be due to a few reasons:\n1. Your prompt may have triggered a safety filter.\n2. There might be a temporary issue with the AI service.\n3. (For site admins) Ensure your Google Cloud project has billing enabled, the 'Generative Language API' is active, and your API key is correctly configured in your deployment environment.";
            return { improvedPrompt: '', reasoning: '', error: failureReason };
        }
        return {
            improvedPrompt: output.improvedPrompt,
            reasoning: output.reasoning,
        };
    } catch (e: any) {
        console.error("Improve prompt API call failed:", e);
        const detailedMessage = "An unexpected error occurred with the prompt enhancement service. For site administrators, please check:\n1. Your GOOGLE_API_KEY is set correctly in your deployment environment.\n2. Billing is enabled for your Google Cloud project.\n3. The 'Generative Language API' is enabled in your project.";
        return { improvedPrompt: '', reasoning: '', error: detailedMessage };
    }
  }
);
