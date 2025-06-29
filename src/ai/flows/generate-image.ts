
'use server';

/**
 * @fileOverview Image generation flow that proxies requests through a custom API route for Stable Horde,
 *               or generates directly on the client-side for Pollinations.
 * - generateImage - A function that calls the appropriate generation service.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The search query for fetching images.'),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to generate.'),
  plan: z.string(),
  model: z.string().describe('The AI model to use for generation, e.g., stable_horde, pollinations.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of URLs of the generated images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// Helper to get dimensions for Pollinations.ai
const getDimensionsForRatio = (ratio: string): { width: number; height: number } => {
    switch (ratio) {
        case '1:1': return { width: 1024, height: 1024 };
        case '16:9': return { width: 1280, height: 720 };
        case '9:16': return { width: 720, height: 1280 };
        case '4:3': return { width: 1024, height: 768 };
        case '3:4': return { width: 768, height: 1024 };
        case '3:2': return { width: 1280, height: 854 };
        case '2:3': return { width: 854, height: 1280 };
        case '21:9': return { width: 1536, height: 640 };
        default: return { width: 1024, height: 1024 };
    }
};

/**
 * Generates images by calling the appropriate service based on the selected model.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
        if (input.model === 'pollinations') {
            const encodedPrompt = encodeURIComponent(input.prompt);
            const { width, height } = getDimensionsForRatio(input.aspectRatio);
            const urls: string[] = [];

            for (let i = 0; i < input.numberOfImages; i++) {
                // Add a random seed to get different variations
                const seed = Math.floor(Math.random() * 1000000);
                const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
                urls.push(url);
            }
            
            return { imageUrls: urls };

        } else if (input.model === 'stable_horde') {
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
        } else {
             return { imageUrls: [], error: `Unknown model selected: ${input.model}` };
        }

    } catch (e: any) {
        console.error("Image generation failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred during image generation: ${e.message}. Please try again later.` };
    }
}
