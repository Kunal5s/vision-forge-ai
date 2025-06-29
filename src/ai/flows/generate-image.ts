'use server';

/**
 * @fileOverview Universal image generation flow, simplified to use only Pollinations.
 * - generateImage - A function that handles the image generation process.
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
  imageUrls: z.array(z.string()).describe('A list of URLs of the fetched images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


/**
 * Generates images using the Pollinations AI service. This is a fast and free option.
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

        const imageUrls = Array(input.numberOfImages).fill(0).map(() => {
            const seed = Math.floor(Math.random() * 10000);
            // The prompt is already enhanced with styles/moods from the frontend.
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?width=${finalWidth}&height=${finalHeight}&seed=${seed}&nologo=true`;
            return url;
        });
        
        return { imageUrls };
    } catch (e: any) {
        console.error("Pollinations generation failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred with the Pollinations service: ${e.message}. The service may be temporarily down.` };
    }
}
