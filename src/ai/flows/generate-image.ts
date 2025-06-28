
'use server';

/**
 * @fileOverview Image generation flow that calls Hugging Face or Google AI.
 * - generateImage - A function that generates images by calling the appropriate API.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
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

// Helper to calculate dimensions based on aspect ratio for Hugging Face models
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
 * Main function to delegate image generation to the correct service.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  if (GOOGLE_MODELS.some(m => m.value === input.model)) {
    return generateWithGoogleAI(input);
  } else {
    return generateWithHuggingFace(input);
  }
}

/**
 * Generates images using Google AI (Gemini).
 */
async function generateWithGoogleAI(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      imageUrls: [],
      error: "The Google/Gemini API key is not configured on the server. Please add GOOGLE_API_KEY or GEMINI_API_KEY to your environment variables to use premium models.",
    };
  }

  try {
    const generationCount = input.plan === 'mega' ? 4 : input.plan === 'pro' ? 1 : 0;
    if (generationCount === 0) {
      return { imageUrls: [], error: "Your current plan does not support premium model generation." };
    }

    const generationPromises = Array.from({ length: generationCount }).map(() =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // Must provide both
        },
      })
    );

    const results = await Promise.all(generationPromises);
    const imageUrls = results.map(res => res.media?.url).filter((url): url is string => !!url);

    if (imageUrls.length === 0) {
      return { imageUrls: [], error: 'The AI returned no images. This could be due to a safety filter or a temporary service issue.' };
    }

    return { imageUrls };

  } catch (e: any) {
    console.error("Google AI generation failed:", e);
    return { imageUrls: [], error: `An error occurred with the Google AI service: ${e.message}. For site administrators, ensure your API key is valid and the Generative Language API is enabled.` };
  }
}

/**
 * Generates an image using the Hugging Face Inference API with key rotation.
 */
async function generateWithHuggingFace(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const hfApiKeys: string[] = [];

  // Directly check for rotating keys from 1 to 10. This is more reliable in serverless environments.
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`HF_API_KEY_${i}`];
    if (key) {
      hfApiKeys.push(key);
    }
  }

  // If no rotating keys were found, check for the single fallback key.
  if (hfApiKeys.length === 0) {
    const singleKey = process.env.HF_API_KEY;
    if (singleKey) {
      hfApiKeys.push(singleKey);
    }
  }
    
  if (hfApiKeys.length === 0) {
    return {
      imageUrls: [],
      error: 'No Hugging Face API keys are configured on the server. Please add at least one HF_API_KEY (or HF_API_KEY_1, HF_API_KEY_2, etc.) to your environment variables.',
    };
  }
  
  const apiKey = hfApiKeys[Math.floor(Math.random() * hfApiKeys.length)];
  
  const { width, height } = getDimensions(input.aspectRatio);
  const apiUrl = `https://api-inference.huggingface.co/models/${input.model}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: input.prompt,
        parameters: {
            width,
            height,
            num_inference_steps: 25,
        }
      }),
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
        let errorBody = `Request failed with status ${response.status}: ${response.statusText}`;
        try {
            const errorJson = await response.json();
            if(errorJson.error) {
                errorBody = `API Error: ${errorJson.error}`;
                if (typeof errorJson.error === 'string' && errorJson.error.includes("is currently loading")) {
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
    
    if (blob.type.startsWith('application/json')) {
        const errorJsonText = await blob.text();
        const errorJson = JSON.parse(errorJsonText);
        const errorMessage = errorJson.error || "The model returned an unexpected error.";
        return { imageUrls: [], error: errorMessage };
    }

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
