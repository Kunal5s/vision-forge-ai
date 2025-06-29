
'use server';

/**
 * @fileOverview Image generation flow that now directly fetches from Pollinations
 *               on the server-side to avoid client-side and relative path issues.
 * - generateImage - A server action that calls the Pollinations API to generate images.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The search query for fetching images.'),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of base64 data URIs of the generated images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


// Helper function to get dimensions from aspect ratio string
const getDimensionsForRatio = (ratio: string) => {
    switch (ratio) {
        case '1:1': return { width: 1024, height: 1024 };
        case '16:9': return { width: 1280, height: 720 };
        case '9:16': return { width: 720, height: 1280 };
        case '4:3': return { width: 1024, height: 768 };
        case '3:4': return { width: 768, height: 1024 };
        case '3:2': return { width: 1280, height: 854 };
        case '2:3': return { width: 854, height: 1280 };
        case '21:9': return { width: 1536, height: 640 };
        case '2:1': return { width: 1280, height: 640 };
        case '3:1': return { width: 1536, height: 512 };
        case '5:4': return { width: 1280, height: 1024 };
        default: return { width: 1024, height: 1024 };
    }
};

/**
 * Generates images by calling Pollinations API directly from a server action.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output with base64 data URLs.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
        const imagePromises: Promise<string>[] = [];

        // Create all fetch promises to be run in parallel
        for (let i = 0; i < input.numberOfImages; i++) {
            const promise = (async () => {
                const { width, height } = getDimensionsForRatio(input.aspectRatio);
                const seed = Math.floor(Math.random() * 1000000); // Add randomness
                const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

                const response = await fetch(pollinationUrl, {
                    headers: { 'Content-Type': 'image/png' }
                });

                if (!response.ok) {
                    throw new Error(`Pollinations API request failed with status ${response.status}`);
                }
                
                const blob = await response.blob();
                
                // Convert blob to base64 data URL to send to the client
                const buffer = await blob.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const dataUrl = `data:${blob.type};base64,${base64}`;
                
                return dataUrl;
            })();
            imagePromises.push(promise);
        }

        const dataUrls = await Promise.all(imagePromises);

        return { imageUrls: dataUrls };

    } catch (e: any) {
        console.error("Image generation failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred during image generation: ${e.message}. Please try again later.` };
    }
}
