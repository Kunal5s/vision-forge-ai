
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
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
        const failureReason = "The AI prompt enhancer requires an API key. As the site administrator, please go to your Cloudflare project settings, find 'Environment variables', add a variable named 'GEMINI_API_KEY' with your key, and then redeploy your project.";
        return { improvedPrompt: '', reasoning: '', error: failureReason };
    }

    try {
        const {output} = await improvePromptPrompt(input);
        if (!output?.improvedPrompt) {
            const failureReason = "The AI could not generate a suggestion. This could be due to a safety filter or a temporary issue with the AI service. If you are the site admin, please ensure your GEMINI_API_KEY is set correctly in your Cloudflare environment variables and that your Google Cloud project has billing enabled.";
            return { improvedPrompt: '', reasoning: '', error: failureReason };
        }
        return {
            improvedPrompt: output.improvedPrompt,
            reasoning: output.reasoning,
        };
    } catch (e: any) {
        console.error("Improve prompt API call failed:", e);
        let detailedMessage = `An unexpected error occurred with the prompt enhancement service. ${e.message}`;
        if (e.message && (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID'))) {
            detailedMessage = "The prompt enhancement service failed because the API key is invalid. Please go to your Cloudflare project settings, find 'Environment variables', check 'GEMINI_API_KEY', and then redeploy.";
        } else if (e.message && e.message.includes('API_KEY_SERVICE_BLOCKED')) {
            detailedMessage = `Google AI error (403 Forbidden): The 'Generative Language API' is likely disabled in your Google Cloud project. Please go to your Google Cloud Console, enable the 'Generative Language API' for your project, ensure billing is active, and then redeploy on Cloudflare.`;
        }
        return { improvedPrompt: '', reasoning: '', error: detailedMessage };
    }
  }
);
