
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
    const apiKeys = [
        process.env.HF_API_KEY_1,
        process.env.HF_API_KEY_2,
        process.env.HF_API_KEY_3,
        process.env.HF_API_KEY_4,
        process.env.HF_API_KEY_5,
        process.env.HF_API_KEY_6,
        process.env.HF_API_KEY_7,
        process.env.HF_API_KEY_8,
        process.env.HF_API_KEY_9,
        process.env.HF_API_KEY_10,
    ].filter((key): key is string => !!key);

    const allErrors: string[] = [];
    for (const apiKey of apiKeys) {
        const hf = new HfInference(apiKey);
        try {
            const keyIdentifier = `...${apiKey.slice(-4)}`;
            console.log(`Attempting image generation with key ending in ${keyIdentifier} for model: ${input.model}`);
            
            const blob = await hf.textToImage({
                model: input.model,
                inputs: input.prompt,
                parameters: {
                    negative_prompt: 'blurry, ugly, distorted, watermark, signature',
                    num_inference_steps: 30,
                },
            }, {
                wait_for_model: true,
                timeout: 30000,
            });

            const buffer = Buffer.from(await blob.arrayBuffer());
            const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
            
            console.log(`Successfully generated image with key ending in ${keyIdentifier}`);
            return { imageUrls: [dataUri] };

        } catch (e: any) {
            const keyIdentifier = `...${apiKey.slice(-4)}`;
            let errorMessage = `API key (ending in ${keyIdentifier}) failed.`;

            if (e.message) {
                if (e.message.includes('is currently loading')) {
                    errorMessage = `The model '${input.model}' is still loading. This is a temporary issue.`;
                } else if (e.message.includes('401') || e.message.includes('authorization')) {
                    errorMessage = `API key (ending in ${keyIdentifier}) is invalid or has insufficient credits.`;
                } else {
                    errorMessage = `An unexpected error occurred with key ${keyIdentifier}: ${e.message}`;
                }
            }
            console.error(errorMessage);
            allErrors.push(errorMessage);
        }
    }

    // This part is reached if the loop completes without a successful return.
    const finalError = `We tried all available API keys, but none succeeded. This could be due to high traffic, exhausted credits on all keys, or a model being temporarily unavailable. Please verify your API keys are correctly configured and try again.`;
    console.error("All available Hugging Face API keys failed.", allErrors);
    return { imageUrls: [], error: finalError };
}


/**
 * Generates images using Google AI (Gemini).
 */
async function generateWithGoogleAI(input: GenerateImageInput): Promise<GenerateImageOutput> {
  try {
    // This check is now only about plan level, not API key existence.
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
    
    let detailedError = `An error occurred with the Google AI service: ${e.message}.`;
    if (e.message && (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID'))) {
        detailedError = 'The configured Google/Gemini API key is invalid or not found. For site administrators, please check your GEMINI_API_KEY environment variable and ensure the Generative Language API is enabled in your Google Cloud project.';
    } else if (e.message && e.message.includes('permission denied')) {
        detailedError = "The Google AI service returned a 'permission denied' error. Please ensure the Generative Language API is enabled in your Google Cloud project and that your API key is correct.";
    }
    
    return { imageUrls: [], error: detailedError };
  }
}
