
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

// Helper to parse aspect ratio into width and height for Hugging Face models
const parseAspectRatio = (ratio: string): { width: number, height: number } => {
    try {
        const [w, h] = ratio.split(':').map(Number);
        if (isNaN(w) || isNaN(h)) return { width: 1024, height: 1024 };

        const baseSize = 1024;
        if (w > h) {
            return { width: baseSize, height: Math.round(baseSize * (h / w)) };
        } else {
            return { width: Math.round(baseSize * (w / h)), height: baseSize };
        }
    } catch (error) {
        return { width: 1024, height: 1024 }; // Default to square on error
    }
};


// Input schema defines the data structure sent from the frontend.
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image.'),
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  model: z.enum(ALL_MODEL_VALUES).describe('The selected generation model identifier.'),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to generate.'),
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
        process.env.HF_API_KEY_1, process.env.HF_API_KEY_2, process.env.HF_API_KEY_3,
        process.env.HF_API_KEY_4, process.env.HF_API_KEY_5, process.env.HF_API_KEY_6,
        process.env.HF_API_KEY_7, process.env.HF_API_KEY_8, process.env.HF_API_KEY_9,
        process.env.HF_API_KEY_10,
    ].filter((key): key is string => !!key && key.trim() !== '');

    if (apiKeys.length === 0) {
      return { imageUrls: [], error: "No Hugging Face API keys are configured. For site administrators, please set up HF_API_KEY_1, HF_API_KEY_2, etc., in your deployment settings." };
    }
    
    const { width, height } = parseAspectRatio(input.aspectRatio);
    const successfulUrls: string[] = [];
    const allErrors: string[] = [];
    let keyIndex = 0;

    for (let i = 0; i < input.numberOfImages; i++) {
        let imageGenerated = false;
        for (let j = 0; j < apiKeys.length; j++) {
            const currentApiKey = apiKeys[keyIndex % apiKeys.length];
            keyIndex++;
            const hf = new HfInference(currentApiKey);
            const keyIdentifier = `...${currentApiKey.slice(-4)}`;

            try {
                console.log(`Attempting image ${i + 1}/${input.numberOfImages} with key ${keyIdentifier} for model: ${input.model}`);
                const blob = await hf.textToImage({
                    model: input.model,
                    inputs: input.prompt,
                    parameters: {
                        negative_prompt: 'blurry, ugly, distorted, watermark, signature',
                        num_inference_steps: 30,
                        width,
                        height,
                    },
                }, {
                    wait_for_model: true,
                    timeout: 30000,
                });

                const buffer = Buffer.from(await blob.arrayBuffer());
                const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
                successfulUrls.push(dataUri);
                imageGenerated = true;
                console.log(`Successfully generated image ${i + 1} with key ${keyIdentifier}`);
                break; // Success, move to the next image
            } catch (e: any) {
                let errorMessage = `API key (${keyIdentifier}) failed.`;
                 if (e.message && e.message.includes('is currently loading')) {
                    const loadingError = `The model '${input.model}' is still loading on the server. Please try again in a moment, or select a different model.`;
                    console.error(loadingError);
                    return { imageUrls: [], error: loadingError };
                }
                if (e.message) {
                    errorMessage += ` Error: ${e.message}`;
                }
                console.error(errorMessage);
                allErrors.push(errorMessage);
            }
        }
        if (!imageGenerated) {
            console.error(`Failed to generate image ${i + 1} with any of the available API keys.`);
        }
    }
    
    if (successfulUrls.length === 0) {
        return { imageUrls: [], error: "We tried all available API keys, but none succeeded in generating images. This could be due to high traffic, exhausted credits, or a model being temporarily unavailable." };
    }

    return { imageUrls: successfulUrls };
}


/**
 * Generates images using Google AI (Gemini).
 */
async function generateWithGoogleAI(input: GenerateImageInput): Promise<GenerateImageOutput> {
  if (!process.env.GEMINI_API_KEY) {
      const errorMessage = "Google/Gemini API key is not configured. For site administrators, please check your GEMINI_API_KEY environment variable.";
      console.error(errorMessage);
      return { imageUrls: [], error: errorMessage };
  }
  
  try {
    let generationCount = 0;
    if (input.plan === 'pro') {
      // Pro plan can only generate 1 image at a time
      generationCount = 1;
    } else if (input.plan === 'mega') {
      // Mega plan can generate the selected number of images
      generationCount = input.numberOfImages;
    }

    if (generationCount === 0) {
      return { imageUrls: [], error: "Your current plan does not support premium model generation." };
    }

    // Hinting aspect ratio in the prompt for Google models
    const finalPrompt = `${input.prompt}, ${input.aspectRatio} aspect ratio`;

    const generationPromises = Array.from({ length: generationCount }).map(() =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: finalPrompt,
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
    
    let detailedError = `An error occurred with the Google AI service.`;
    if (e.message) {
      if (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID')) {
          detailedError = 'The configured Google/Gemini API key is invalid. Please verify the key in your environment settings and ensure it is active.';
      } else if (e.message.includes('permission denied') || e.message.includes('Forbidden') || e.message.includes('are blocked')) {
          detailedError = "The Google AI service blocked the request. This is often due to the 'Generative Language API' not being enabled in your Google Cloud project, or billing not being set up. Please verify your Google Cloud project configuration.";
      } else {
          detailedError = `An unexpected error occurred: ${e.message}`;
      }
    }
    
    return { imageUrls: [], error: detailedError };
  }
}
