
'use server';

/**
 * @fileOverview Universal image generation flow, now using a server-side fetch
 *               to improve reliability on platforms like Cloudflare.
 * - generateImage - A function that fetches images from Pollinations and returns them as data URIs.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
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
  imageUrls: z.array(z.string()).describe('A list of URLs (now data URIs) of the fetched images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


/**
 * Generates images using the Pollinations AI service by fetching them on the server
 * and returning them as data URIs. This is a fast, free, and reliable method.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
        const [width, height] = input.aspectRatio.split(':').map(Number);
        // Optimized for faster generation on Pollinations.
        const scaleFactor = 1024 / Math.max(width, height);
        const finalWidth = Math.round(width * scaleFactor);
        const finalHeight = Math.round(height * scaleFactor);

        // First, construct the URLs that we will fetch on the server.
        const constructedUrls = Array(input.numberOfImages).fill(0).map(() => {
            const seed = Math.floor(Math.random() * 10000);
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?width=${finalWidth}&height=${finalHeight}&seed=${seed}&nologo=true`;
        });

        // Now, fetch each image on the server and convert it to a data URI.
        // This bypasses potential client-side network issues on platforms like Cloudflare.
        const imagePromises = constructedUrls.map(async (url) => {
            try {
                const response = await fetch(url, { cache: 'no-store' }); // Use no-store to get fresh images
                if (!response.ok) {
                    console.error(`Failed to fetch image from Pollinations: ${response.status} ${response.statusText}`);
                    return null;
                }
                // Convert the image response to a base64 data URI
                const buffer = await response.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const mimeType = response.headers.get('content-type') || 'image/png';
                return `data:${mimeType};base64,${base64}`;
            } catch (fetchError) {
                console.error(`Error fetching URL ${url}:`, fetchError);
                return null;
            }
        });

        const dataUris = await Promise.all(imagePromises);
        const successfulDataUris = dataUris.filter((uri): uri is string => uri !== null);
        
        if (successfulDataUris.length === 0) {
           return { imageUrls: [], error: 'Failed to fetch any images from the Pollinations service. The service might be temporarily down or blocking requests from the server.' };
        }

        return { imageUrls: successfulDataUris };

    } catch (e: any) {
        console.error("Pollinations generation failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred during image generation: ${e.message}. Please try again later.` };
    }
}
