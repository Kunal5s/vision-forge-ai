
'use server';

/**
 * @fileOverview Image generation flow that proxies requests through a custom API route,
 *               making it compatible with Cloudflare Pages deployment.
 * - generateImage - A function that calls the app's /api/generate endpoint.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The search query for fetching images.'),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to generate.'),
  // Kept for schema compatibility with the calling component, though unused in the new flow.
  plan: z.string(),
  model: z.string(),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of URLs of the generated images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

/**
 * Generates images by calling our own backend API endpoint (/api/generate).
 * This is required for Cloudflare Pages deployment and provides a more reliable generation experience.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
        // This relative path will call the Cloudflare function when deployed.
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: input.prompt,
                numberOfImages: input.numberOfImages,
                aspectRatio: input.aspectRatio
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `API request failed with status ${response.status}`);
        }

        if (result.error) {
           return { imageUrls: [], error: result.error };
        }
        
        if (!result.imageUrls || result.imageUrls.length === 0) {
           return { imageUrls: [], error: 'The generation service did not return any images. The network may be busy.' };
        }

        return { imageUrls: result.imageUrls };

    } catch (e: any) {
        console.error("Image generation via API proxy failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred during image generation: ${e.message}. Please try again later.` };
    }
}
