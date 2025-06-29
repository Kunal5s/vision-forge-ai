
'use server';

/**
 * @fileOverview Image generation flow that proxies requests through a custom Next.js API route
 *               to handle image fetching from Pollinations on the server-side. This avoids
 *               CORS and other browser-related issues when deploying on platforms like Cloudflare.
 * - generateImage - A function that calls the backend API route to generate images.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The search query for fetching images.'),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to generate.'),
  plan: z.string(),
  model: z.string().describe('The AI model to use for generation.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of blob URLs of the generated images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

/**
 * Generates images by calling our own backend API route, which then fetches from Pollinations.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output with blob URLs.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
        const urls: string[] = [];
        const imagePromises: Promise<Response>[] = [];

        // Create all fetch promises to be run in parallel
        for (let i = 0; i < input.numberOfImages; i++) {
            const promise = fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: input.prompt,
                    aspectRatio: input.aspectRatio
                }),
            });
            imagePromises.push(promise);
        }

        const responses = await Promise.all(imagePromises);
        
        for (const response of responses) {
            if (!response.ok) {
                try {
                    const errorResult = await response.json();
                    throw new Error(errorResult.error || `API request failed with status ${response.status}`);
                } catch {
                    throw new Error(`API request failed with status ${response.status}`);
                }
            }
            
            // The response body is the image data itself
            const blob = await response.blob();
            // Create a temporary local URL for the image blob
            const url = URL.createObjectURL(blob);
            urls.push(url);
        }

        return { imageUrls: urls };

    } catch (e: any) {
        console.error("Image generation failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred during image generation: ${e.message}. Please try again later.` };
    }
}
