
'use server';

/**
 * @fileOverview Image generation flow that securely calls backend APIs using environment variables.
 * - generateImage - A function that generates images by calling the appropriate API.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { HfInference } from '@huggingface/inference';
import { ALL_MODEL_VALUES, GOOGLE_MODELS } from '@/lib/constants';

// --- Helper function to find available Hugging Face API keys ---
function getHuggingFaceKeys(): string[] {
  const keys: string[] = [];
  // Check for rotating keys HF_API_KEY_1, HF_API_KEY_2, ...
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`HF_API_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }
  // Fallback to a single key if no rotating keys are found
  if (keys.length === 0 && process.env.HF_API_KEY) {
    keys.push(process.env.HF_API_KEY);
  }
  return keys;
}

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

/**
 * Main function to delegate image generation to the correct service.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const isGoogleModel = GOOGLE_MODELS.some(m => m.value === input.model);

  if (isGoogleModel) {
    return generateWithGoogleAI(input);
  } else {
    return generateWithHuggingFace(input);
  }
}

/**
 * Generates images using Hugging Face Inference API with a robust key rotation and retry mechanism.
 */
async function generateWithHuggingFace(input: GenerateImageInput): Promise<GenerateImageOutput> {
  let hfKeys = getHuggingFaceKeys();
  if (hfKeys.length === 0) {
    const errorMsg = "No Hugging Face API keys are configured on the server. For site administrators, please set the HF_API_KEY environment variable in your deployment settings.";
    console.error(errorMsg);
    return { imageUrls: [], error: errorMsg };
  }
  
  // Shuffle keys to distribute load and not always hit the same key first on retries.
  hfKeys = hfKeys.sort(() => Math.random() - 0.5);

  const allErrors: string[] = [];

  for (const apiKey of hfKeys) {
    const hf = new HfInference(apiKey);
    try {
      console.log(`Attempting image generation with a new key for model: ${input.model}`);
      const blob = await hf.textToImage({
        model: input.model,
        inputs: input.prompt,
        parameters: {
          negative_prompt: 'blurry, ugly, distorted, watermark, signature',
          num_inference_steps: 30, // More steps for better quality
        },
      }, {
        wait_for_model: true, // Wait if the model is loading
        timeout: 30000, // 30-second timeout
      });

      // Convert Blob to a data URI to send to the frontend
      const buffer = Buffer.from(await blob.arrayBuffer());
      const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;

      // Success! Return the image.
      console.log(`Successfully generated image for model: ${input.model}`);
      return { imageUrls: [dataUri] };

    } catch (e: any) {
      const keyIdentifier = `...${apiKey.slice(-4)}`;
      let errorMessage = `API key ending in ${keyIdentifier} failed.`;

      if (e.message) {
        if (e.message.includes('is currently loading')) {
          errorMessage = `The model '${input.model}' is still loading. This is a temporary issue.`;
        } else if (e.message.includes('401') || e.message.includes('authorization')) {
          errorMessage = `API key ending in ${keyIdentifier} is invalid or has insufficient credits.`;
        } else {
          errorMessage = `An unexpected error occurred with key ${keyIdentifier}: ${e.message}`;
        }
      }
      console.error(errorMessage);
      allErrors.push(errorMessage);
    }
  }
  
  // This part is reached only if all keys have failed
  console.error("All available Hugging Face API keys failed.", allErrors);
  const finalError = `We tried all available API keys, but none succeeded in generating an image. This could be due to high traffic, exhausted credits on all keys, or the model being temporarily unavailable. Please try again later.`;
  return { imageUrls: [], error: finalError };
}


/**
 * Generates images using Google AI (Gemini).
 */
async function generateWithGoogleAI(input: GenerateImageInput): Promise<GenerateImageOutput> {
  // We will let the Genkit client handle API key errors from the environment.
  // The GOOGLE_API_KEY or GEMINI_API_KEY must be set in the deployment environment.
  try {
    // Mega plan gets 4 variations, Pro gets 1. Free plan gets 0.
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
    // Provide a more helpful error message for administrators.
    if (e.message && e.message.includes('API key not valid')) {
        return { imageUrls: [], error: 'The configured Google/Gemini API key is invalid. For site administrators, please check your API key and ensure the Generative Language API is enabled in your Google Cloud project.' };
    }
    return { imageUrls: [], error: `An error occurred with the Google AI service: ${e.message}. For site administrators, ensure your API key is valid and the Generative Language API is enabled.` };
  }
}
