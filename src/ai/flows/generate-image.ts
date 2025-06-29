
'use server';

/**
 * @fileOverview Universal image generation flow that routes to different services.
 * - Routes to Pexels for the 'Imagen Brain AI' model.
 * - Routes to Google's Imagen model for premium generation.
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { ALL_MODEL_VALUES } from '@/lib/constants';

// Input schema defines the data structure sent from the frontend.
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The search query for fetching images.'),
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  model: z.enum(ALL_MODEL_VALUES).describe('The selected model identifier.'),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Output schema defines the data structure returned to the frontend.
const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of URLs of the fetched images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


/**
 * Main function to delegate image generation based on the selected model.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  if (input.model === 'imagen-brain-ai') {
    return generateWithPexels(input);
  } else {
    // All other models are assumed to be premium Genkit models for now.
    return generateWithGenkit(input);
  }
}

/**
 * Generates images using Genkit and a Google AI model.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithGenkit(input: GenerateImageInput): Promise<GenerateImageOutput> {
  if (input.plan === 'free') {
    return {
      imageUrls: [],
      error: "You need a Pro or Mega plan to use premium AI models. Please upgrade your plan.",
    };
  }

  try {
    const generationPromises = Array(input.numberOfImages).fill(0).map(() => 
      ai.generate({
        model: input.model as any,
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const results = await Promise.all(generationPromises);
    
    const imageUrls = results.map(result => {
        if (!result.media?.url) {
            throw new Error("AI model did not return an image.");
        }
        return result.media.url; // This will be a data URI
    });
    
    return { imageUrls };

  } catch (e: any) {
    console.error("Genkit generation failed:", e);
    let detailedMessage = `An unexpected error occurred with the AI model. ${e.message || ''}`;
    if (e.message && (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID'))) {
        detailedMessage = "Image generation failed due to an invalid API key. (For site admins) Please check your GEMINI_API_KEY, ensure billing is enabled for your Google Cloud project, and that the 'Generative Language API' is enabled.";
    }
    return { imageUrls: [], error: detailedMessage };
  }
}


/**
 * Fetches images from Pexels API based on the user's prompt and desired aspect ratio.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithPexels(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY || PEXELS_API_KEY === "YOUR_PEXELS_API_KEY_HERE" || PEXELS_API_KEY === "") {
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
    
    const imageUrls = data.photos.slice(0, input.numberOfImages).map((photo: any) => photo.src.large2x);

    return { imageUrls };

  } catch (e: any) {
    console.error("Pexels fetch failed:", e);
    return { imageUrls: [], error: e.message || 'An unknown error occurred while fetching images from Pexels.' };
  }
}
