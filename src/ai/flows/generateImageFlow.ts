'use server';
/**
 * @fileOverview A flow for generating images using Google's Gemini model.
 */
import {ai} from '@/ai/genkit';
import type { GenerateImageInput, GenerateImageOutput } from '@/types';
import { GenerateImageInputSchema, GenerateImageOutputSchema } from '@/types';

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const imagePromises = Array.from({ length: input.count }, () =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const results = await Promise.all(imagePromises);

    const images = results.map(result => {
        if (!result.media.url) {
            throw new Error('Image generation failed to return a valid URL.');
        }
        return result.media.url;
    });

    return { images };
  }
);
