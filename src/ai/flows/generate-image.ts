
'use server';

/**
 * @fileOverview Image generation flow that proxies requests to an external Cloudflare Worker.
 * - generateImage - A function that generates images by calling the external API.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ALL_MODEL_VALUES } from '@/lib/constants';

// Input schema defines the data structure sent from the frontend to the backend proxy.
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image.'),
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  model: z.enum(ALL_MODEL_VALUES).describe('The selected generation model identifier.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Output schema defines the data structure expected back from the Cloudflare Worker.
const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of data URIs of the generated images.'),
  error: z.string().optional().describe('An error message if the generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// The external API endpoint provided by the user.
const EXTERNAL_API_URL = 'https://imagenbrainai.in/api/generate';

/**
 * Generates an image by sending a request to the configured Cloudflare Worker.
 * This function acts as a server-side proxy to the actual generation service.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  try {
    const response = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      // Adding a timeout to prevent long hangs
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      // Try to parse error from the worker's response body
      let errorBody = 'An unknown error occurred.';
      try {
        const errorJson = await response.json();
        errorBody = errorJson.error || `Request failed with status ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorBody = `Request failed with status ${response.status}: ${response.statusText}. Could not parse error response.`;
      }
      console.error("External API call failed:", errorBody);
      return { imageUrls: [], error: errorBody };
    }

    const result = await response.json();

    // Validate the response from the worker to ensure it matches our expected output.
    const parsedResult = GenerateImageOutputSchema.safeParse(result);
    if (!parsedResult.success) {
        console.error("Invalid response from external API:", parsedResult.error);
        return { imageUrls: [], error: "Received an invalid response from the image generation service. Please try again." };
    }

    return parsedResult.data;

  } catch (e: any) {
    console.error("Failed to fetch from external API:", e);
    let errorMessage = "An unexpected error occurred while contacting the image generation service.";
    if (e.name === 'TimeoutError') {
        errorMessage = "The image generation request timed out. The service might be under heavy load. Please try again in a moment.";
    } else if (e.message) {
        errorMessage = `Failed to connect to the image service: ${e.message}`;
    }
    return { imageUrls: [], error: errorMessage };
  }
}
