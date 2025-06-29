
'use server';

/**
 * @fileOverview Image generation flow that securely calls the Pexels API to find real photos matching a prompt.
 * - generateImage - A function that fetches images from Pexels based on a prompt and aspect ratio.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ALL_MODEL_VALUES } from '@/lib/constants';

// Input schema defines the data structure sent from the frontend.
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The search query for fetching images from Pexels.'),
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan (ignored for Pexels)."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  model: z.enum(ALL_MODEL_VALUES).describe('The selected model identifier (will always be "imagen-brain-ai").'),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to fetch.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Output schema defines the data structure returned to the frontend.
const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of URLs of the fetched images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

/**
 * Fetches images from Pexels API based on the user's prompt and desired aspect ratio.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithPexels(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY || PEXELS_API_KEY === "YOUR_PEXELS_API_KEY_HERE") {
    return { 
      imageUrls: [], 
      error: "Pexels API key is not configured. For site administrators, please add your PEXELS_API_KEY to the environment variables." 
    };
  }

  try {
    const orientationMap: Record<string, string> = {
      '16:9': 'landscape',
      '21:9': 'landscape',
      '3:2': 'landscape',
      '4:3': 'landscape',
      '9:16': 'portrait',
      '2:3': 'portrait',
      '3:4': 'portrait',
      '1:1': 'square',
    };
    const orientation = orientationMap[input.aspectRatio] || 'landscape';

    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(input.prompt)}&per_page=${input.numberOfImages * 5}&orientation=${orientation}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pexels API returned an error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return { 
        imageUrls: [], 
        error: `No photos found for "${input.prompt}". Try a different search term.`
      };
    }
    
    // Although we filter by orientation, we can do a secondary check for a closer aspect ratio match if needed.
    // For now, we trust Pexels' orientation filter and take the first results.
    const imageUrls = data.photos.slice(0, input.numberOfImages).map((photo: any) => photo.src.large2x);

    return { imageUrls };

  } catch (e: any) {
    console.error("Pexels fetch failed:", e);
    return { imageUrls: [], error: e.message || 'An unknown error occurred while fetching images from Pexels.' };
  }
}

/**
 * Main function to delegate image generation to the Pexels service.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateWithPexels(input);
}
