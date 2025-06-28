
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
 * This function is designed to be highly resilient, trying every available API key for each requested image.
 */
async function generateWithHuggingFace(input: GenerateImageInput): Promise<GenerateImageOutput> {
    const apiKeys = [
        process.env.HF_API_KEY_1, process.env.HF_API_KEY_2, process.env.HF_API_KEY_3,
        process.env.HF_API_KEY_4, process.env.HF_API_KEY_5, process.env.HF_API_KEY_6,
        process.env.HF_API_KEY_7, process.env.HF_API_KEY_8, process.env.HF_API_KEY_9,
        process.env.HF_API_KEY_10,
    ].filter((key): key is string => !!key && key.trim() !== '');

    if (apiKeys.length === 0) {
      // This error is for the developer/administrator, not the end user, if no keys are set in the environment.
      return { imageUrls: [], error: "FATAL: No Hugging Face API keys are configured in the environment." };
    }
    
    const { width, height } = parseAspectRatio(input.aspectRatio);
    const successfulUrls: string[] = [];
    let keyIndex = 0; // To keep track of which key to use next.

    for (let i = 0; i < input.numberOfImages; i++) {
        let imageGenerated = false;
        // Try every available API key for the current image generation.
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
                        negative_prompt: 'low quality, worst quality, bad hands, extra limbs, jpeg artifacts, blurry, ugly, distorted, watermark, signature',
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        width,
                        height,
                    },
                }, {
                    wait_for_model: true,
                    timeout: 90000, // Increased timeout to 90 seconds for slower models
                });

                const buffer = Buffer.from(await blob.arrayBuffer());
                const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
                successfulUrls.push(dataUri);
                imageGenerated = true;
                console.log(`Successfully generated image ${i + 1} with key ${keyIdentifier}`);
                break; // Success! Move to the next image generation.
            } catch (e: any) {
                const errorMessage = e.message || '';

                // Specific, critical error: if a model is loading, it's pointless to try other keys.
                // Inform the user and stop this entire generation request.
                if (errorMessage.includes('is currently loading')) {
                    const loadingError = `The model '${input.model}' is still loading on the Hugging Face servers. This can take a few minutes. Please try again shortly or select a different model.`;
                    console.error(loadingError);
                    // Return this specific error to the user.
                    return { imageUrls: successfulUrls, error: loadingError };
                }
                
                // For any other error (e.g., key quota exhausted, network issue), just log it and try the next key.
                console.error(`API key (${keyIdentifier}) failed. Error: ${errorMessage}. Trying next key.`);
            }
        }

        if (!imageGenerated) {
            console.error(`Failed to generate image ${i + 1} with any of the available API keys.`);
            // Don't stop. If other images were requested, they might still succeed.
        }
    }
    
    // If after all attempts, no images were generated, return a generic but helpful error message.
    if (successfulUrls.length === 0) {
        return { imageUrls: [], error: `The model '${input.model}' is facing high demand or a temporary issue. This is common. Please select a different model or try again in a few minutes.` };
    }

    // Return all successfully generated images, even if some failed.
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
