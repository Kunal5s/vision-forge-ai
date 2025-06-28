
'use server';

/**
 * @fileOverview Image generation flow that calls the Hugging Face Inference API.
 * - generateImage - A function that generates images by calling the external API.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ALL_MODEL_VALUES, GOOGLE_MODELS } from '@/lib/constants';

// Input schema defines the data structure sent from the frontend.
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image.'),
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  model: z.enum(ALL_MODEL_VALUES).describe('The selected generation model identifier.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Output schema defines the data structure returned to the frontend.
const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of data URIs of the generated images.'),
  error: z.string().optional().describe('An error message if the generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// Helper to calculate dimensions based on aspect ratio
function getDimensions(aspectRatio: string): { width: number; height: number } {
  const [w, h] = aspectRatio.split(':').map(Number);
  const basePixels = 1024 * 1024; // Aim for a base resolution around 1 megapixel
  const ratio = w / h;

  let height = Math.sqrt(basePixels / ratio);
  let width = height * ratio;

  // Snap to the nearest multiple of 64 for model compatibility
  width = Math.round(width / 64) * 64;
  height = Math.round(height / 64) * 64;

  return { width, height };
}

/**
 * Generates an image by sending a request to the appropriate inference API.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  // Check if a premium Google model was selected
  if (GOOGLE_MODELS.some(m => m.value === input.model)) {
    return {
      imageUrls: [],
      error: "This premium Google Model requires a full Vertex AI backend setup, which is not yet implemented. Please select a model from the 'Stable Diffusion & Community Models' list to generate images.",
    };
  }

  // Handle Hugging Face models
  const HUGGING_FACE_API_KEY = process.env.HF_API_KEY;
  if (!HUGGING_FACE_API_KEY) {
    return {
      imageUrls: [],
      error: 'The Hugging Face API key is not configured on the server. Please add HF_API_KEY to your environment variables.',
    };
  }

  const { width, height } = getDimensions(input.aspectRatio);
  const apiUrl = `https://api-inference.huggingface.co/models/${input.model}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: input.prompt,
        parameters: {
            width,
            height,
            num_inference_steps: 25
        }
      }),
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
        let errorBody = `Request failed with status ${response.status}: ${response.statusText}`;
        try {
            const errorJson = await response.json();
            // Hugging Face often returns errors in an 'error' property
            if(errorJson.error) {
                errorBody = `API Error: ${errorJson.error}`;
                if (errorJson.error.includes("is currently loading")) {
                    errorBody += ". This is common for less-used models. Please try again in a few minutes."
                }
            }
        } catch (e) {
            // Could not parse JSON, stick with the status text.
        }
        console.error("Hugging Face API call failed:", errorBody);
        return { imageUrls: [], error: errorBody };
    }

    const blob = await response.blob();

    // If HF returns a JSON response, it's an error.
    if (blob.type.startsWith('application/json')) {
        const errorJsonText = await blob.text();
        const errorJson = JSON.parse(errorJsonText);
        const errorMessage = errorJson.error || "The model returned an unexpected error.";
        return { imageUrls: [], error: errorMessage };
    }

    // Convert successful image response (blob) to a data URI
    const buffer = Buffer.from(await blob.arrayBuffer());
    const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;

    return { imageUrls: [dataUri] };

  } catch (e: any) {
    console.error("Failed to fetch from Hugging Face API:", e);
    let errorMessage = "An unexpected error occurred while contacting the image generation service.";
    if (e.name === 'TimeoutError') {
      errorMessage = 'The image generation request timed out. The service might be under heavy load or the selected model is loading. Please try again in a moment.';
    } else if (e.message) {
      errorMessage = `Failed to connect to the image service: ${e.message}`;
    }
    return { imageUrls: [], error: errorMessage };
  }
}
