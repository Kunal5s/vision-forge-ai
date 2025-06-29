
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
import { ALL_MODEL_VALUES, GOOGLE_MODELS, POLLINATIONS_MODELS } from '@/lib/constants';

// Helper to parse aspect ratio into width and height for Hugging Face.
// Hugging Face models work best with dimensions that are multiples of 64.
const parseAspectRatio = (ratio: string, baseSize: number = 1024): { width: number, height: number } => {
    try {
        const [w, h] = ratio.split(':').map(Number);
        if (isNaN(w) || isNaN(h)) return { width: baseSize, height: baseSize };

        let width, height;

        if (w > h) {
            width = baseSize;
            height = Math.round(baseSize * (h / w));
        } else {
            width = Math.round(baseSize * (w / h));
            height = baseSize;
        }

        // Ensure dimensions are multiples of 64
        return {
            width: Math.round(width / 64) * 64,
            height: Math.round(height / 64) * 64
        };
    } catch (error) {
        return { width: baseSize, height: baseSize }; // Default to square on error
    }
};

// Helper to get fixed dimensions for Stable Horde to optimize for kudos-free generation.
const getHordeDimensions = (ratio: string): { width: number, height: number } => {
    const map: Record<string, [number, number]> = {
        "1:1": [512, 512],
        "16:9": [704, 396],
        "4:3": [640, 480],
        "3:2": [672, 448],
        "2:3": [448, 672],
        "9:16": [396, 704],
    };
    const [width, height] = map[ratio] || [512, 512];
    return { width, height };
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
  const isPollinationsModel = POLLINATIONS_MODELS.some(m => m.value === input.model);

  if (isGoogleModel) {
    return generateWithGoogleAI(input);
  } else if (isPollinationsModel) {
    return generateWithPollinations(input);
  } else {
    return generateWithHuggingFace(input);
  }
}

/**
 * Helper function to introduce a delay.
 * @param ms Milliseconds to wait.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates images using the free Pollinations AI service.
 */
async function generateWithPollinations(input: GenerateImageInput): Promise<GenerateImageOutput> {
  try {
    const { width, height } = parseAspectRatio(input.aspectRatio);
    const encodedPrompt = encodeURIComponent(input.prompt);

    const generationPromises = Array.from({ length: input.numberOfImages }).map(async (_, i) => {
        const seed = Date.now() + i;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
        
        const response = await fetch(imageUrl);
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image')) {
            console.warn(`Pollinations AI failed to return a valid image for prompt: ${input.prompt}`);
            return null;
        }

        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        return `data:${blob.type};base64,${buffer.toString('base64')}`;
    });

    const results = await Promise.all(generationPromises);
    const imageUrls = results.filter((url): url is string => !!url);

    if (imageUrls.length === 0) {
      throw new Error('Pollinations AI failed to generate any images. It might be busy or the prompt was disallowed.');
    }

    return { imageUrls };

  } catch (e: any) {
    console.error("Pollinations AI generation failed:", e);
    return { imageUrls: [], error: e.message || 'An unknown error occurred with the Pollinations AI service.' };
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
      return { imageUrls: [], error: "This site is not configured for Hugging Face generation. For site administrators, please check your HF_API_KEY environment variables." };
    }
    
    const { width, height } = parseAspectRatio(input.aspectRatio);
    let keyIndex = 0; 

    // This function attempts to generate a single image, trying all keys if necessary.
    const tryGenerateOneImage = async (): Promise<string | null> => {
        for (let j = 0; j < apiKeys.length; j++) {
            const currentApiKey = apiKeys[keyIndex % apiKeys.length];
            keyIndex++;
            const hf = new HfInference(currentApiKey);
            const keyIdentifier = `...${currentApiKey.slice(-4)}`;

            try {
                console.log(`Attempting image with key ${keyIdentifier} for model: ${input.model}`);
                const blob = await hf.textToImage({
                    model: input.model,
                    inputs: `masterpiece, best quality, ${input.prompt}`,
                    parameters: {
                        negative_prompt: 'low quality, worst quality, bad hands, extra limbs, jpeg artifacts, blurry, ugly, distorted, watermark, signature',
                        num_inference_steps: 30,
                        guidance_scale: 7.0,
                        width,
                        height,
                    },
                }, {
                    wait_for_model: true,
                    timeout: 90000, 
                });

                const buffer = Buffer.from(await blob.arrayBuffer());
                const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
                console.log(`Successfully generated image with key ${keyIdentifier}`);
                return dataUri;

            } catch (e: any) {
                const errorMessage = e.message || '';
                if (errorMessage.includes('is currently loading')) {
                    // This error is fatal for this model at this time, so we throw to stop all parallel attempts for it.
                    throw new Error(`The model '${input.model}' is still loading on the Hugging Face servers. This can take a few minutes. Please try again shortly or select a different model.`);
                }
                console.error(`API key (${keyIdentifier}) failed. Error: ${errorMessage}. Trying next key.`);
            }
        }
        // If all keys fail for this image generation attempt
        console.error(`Failed to generate an image with any of the available API keys.`);
        return null;
    };

    try {
        const generationPromises = Array.from({ length: input.numberOfImages }).map(() => tryGenerateOneImage());
        const results = await Promise.all(generationPromises);
        const successfulUrls = results.filter((url): url is string => !!url);

        if (successfulUrls.length === 0) {
            return { imageUrls: [], error: `The model '${input.model}' is facing high demand or a temporary issue. Please select a different model or try again in a few minutes.` };
        }

        return { imageUrls: successfulUrls };

    } catch (e: any) {
        // This catches the fatal error thrown from `tryGenerateOneImage`
        return { imageUrls: [], error: e.message };
    }
}


/**
 * Generates images using Google AI (Gemini).
 */
async function generateWithGoogleAI(input: GenerateImageInput): Promise<GenerateImageOutput> {
  if (!process.env.GEMINI_API_KEY) {
      const errorMessage = "This site is not configured for Google AI generation. For site administrators, please check your GEMINI_API_KEY environment variable.";
      console.error(errorMessage);
      return { imageUrls: [], error: errorMessage };
  }
  
  try {
    let generationCount = 0;
    if (input.plan === 'pro') {
      generationCount = 1;
    } else if (input.plan === 'mega') {
      generationCount = input.numberOfImages;
    }

    if (generationCount === 0) {
      return { imageUrls: [], error: "Your current plan does not support premium model generation." };
    }

    const finalPrompt = `${input.prompt}, ${input.aspectRatio} aspect ratio`;

    const generationPromises = Array.from({ length: generationCount }).map(() =>
      ai.generate({
        model: input.model as any,
        prompt: finalPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
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
          detailedError = 'The configured Google/Gemini API key is invalid. Please verify the key and ensure it is active.';
      } else if (e.message.includes('permission denied') || e.message.includes('Forbidden') || e.message.includes('are blocked')) {
          detailedError = "The Google AI service blocked the request. This is often due to the 'Generative Language API' not being enabled in your Google Cloud project, or billing not being set up. Please verify your Google Cloud project configuration.";
      } else {
          detailedError = `An unexpected error occurred: ${e.message}`;
      }
    }
    
    return { imageUrls: [], error: detailedError };
  }
}
