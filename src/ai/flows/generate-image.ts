'use server';
/**
 * @fileOverview A powerful image generation flow using Google's Gemini model.
 * This provides a fast and high-quality alternative to free services.
 * - generateImage - A server action that calls the Gemini API to generate images.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the image.'),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  numberOfImages: z.number().min(1).max(4).describe('The number of images to generate (max 4).'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of base64 data URIs of the generated images.'),
  error: z.string().optional().describe('An error message if the generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

/**
 * Generates images by calling Google's Gemini model in parallel.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output with base64 data URLs.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  // Add aspect ratio information directly into the prompt for the AI to follow.
  const fullPrompt = `${input.prompt}, aspect ratio ${input.aspectRatio}`;

  try {
    const generationPromises = Array.from({ length: input.numberOfImages }, () =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: fullPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const results = await Promise.all(generationPromises);

    const imageUrls = results.map(result => {
      if (!result.media?.url) {
        // This can happen if the model refuses to generate the image due to safety policies.
        throw new Error('Image generation succeeded but the result was empty. This may be due to a safety policy violation. Please try a different prompt.');
      }
      return result.media.url;
    });

    return { imageUrls };

  } catch (e: any) {
    console.error("Image generation failed with Google Gemini:", e);
    
    let errorMessage = "An unexpected error occurred. Please try again later.";
    if (e.message?.includes('API key')) {
        errorMessage = "Image generation failed. The Google API key is invalid, missing, or has not been configured correctly in your environment variables.";
    } else if (e.message?.includes('billing')) {
        errorMessage = "Image generation failed. Please check if billing is enabled for your Google Cloud project.";
    } else if (e.message?.includes('safety policy')) {
        errorMessage = e.message;
    }

    return { imageUrls: [], error: errorMessage };
  }
}
