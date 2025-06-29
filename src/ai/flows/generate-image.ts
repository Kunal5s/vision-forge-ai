
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
import { ALL_MODEL_VALUES, GOOGLE_MODELS, POLLINATIONS_MODELS, HF_MODELS } from '@/lib/constants';

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
  const isHuggingFaceModel = HF_MODELS.some(m => m.value === input.model);

  if (isGoogleModel) {
    return generateWithGoogleAI(input);
  } else if (isPollinationsModel) {
    return generateWithPollinations(input);
  } else if (isHuggingFaceModel) {
    return generateWithHuggingFace(input);
  } else {
    // Default to Stable Horde if no other match
    return generateWithStableHorde(input);
  }
}

/**
 * Helper function to introduce a delay.
 * @param ms Milliseconds to wait.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Generates images using Stable Horde with polling and timeout.
 */
async function generateWithStableHorde(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const HORDE_API_KEY = process.env.STABLE_HORDE_API_KEY || '5K1zxHm8MAC1gENuac0EeA';

  try {
    const { width, height } = getHordeDimensions(input.aspectRatio);
    const fullPrompt = `${input.prompt}, masterpiece, best quality`;
    
    const payload = {
        prompt: fullPrompt,
        params: {
            sampler_name: "k_euler_a",
            cfg_scale: 7,
            steps: 20,
            n: input.numberOfImages,
            width,
            height,
        },
        nsfw: false,
        censor_nsfw: true,
        trusted_workers: false,
        models: ["deliberate", "rev_animated"],
        r2: true,
    };

    const initialResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": HORDE_API_KEY,
            "Client-Agent": "ImagenBrainAI/1.0",
        },
        body: JSON.stringify(payload),
    });

    if (!initialResponse.ok) {
        const errorText = await initialResponse.text();
        console.error("Stable Horde initial request failed:", errorText);
        throw new Error(`Stable Horde API returned an error: ${initialResponse.statusText}. Check your API key or network status.`);
    }

    const contentType = initialResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Stable Horde returned an unexpected content type: ${contentType}`);
    }
    
    const jobRequest = await initialResponse.json();
    const jobId = jobRequest.id;

    if (!jobId) {
        throw new Error("Stable Horde did not return a job ID.");
    }

    const MAX_POLL_ATTEMPTS = 30; // 30 attempts * 3s = 90 seconds timeout
    const POLL_INTERVAL_MS = 3000;

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        await sleep(POLL_INTERVAL_MS);

        const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`);
        if (!statusResponse.ok) {
             console.warn(`Stable Horde status poll failed with status: ${statusResponse.status}. Retrying...`);
             continue;
        }

        const statusContentType = statusResponse.headers.get("content-type");
        if (!statusContentType || !statusContentType.includes("application/json")) {
            console.warn(`Stable Horde status check returned non-JSON content type: ${statusContentType}. Retrying...`);
            continue;
        }
        
        const statusResult = await statusResponse.json();

        if (statusResult.faulted) {
             throw new Error("Image generation failed on the Stable Horde worker. Please try again.");
        }

        if (statusResult.done) {
            const generationPromises = (statusResult.generations || []).map(async (gen: any) => {
                if (!gen.img || gen.censored) return null;
                try {
                    const imageResponse = await fetch(gen.img);
                    if (!imageResponse.ok || !imageResponse.headers.get('content-type')?.startsWith('image')) {
                        console.warn(`Stable Horde returned an invalid image URL: ${gen.img}`);
                        return null;
                    }
                    const blob = await imageResponse.blob();
                    const buffer = Buffer.from(await blob.arrayBuffer());
                    return `data:${blob.type};base64,${buffer.toString('base64')}`;
                } catch (e) {
                    console.error(`Failed to fetch image from Stable Horde URL ${gen.img}:`, e);
                    return null;
                }
            });

            const results = await Promise.all(generationPromises);
            const imageUrls = results.filter((url): url is string => !!url);
            
            if (imageUrls.length === 0) {
               throw new Error("Generation completed, but no valid images were returned. This could be due to a network issue or content filter.");
            }
            
            return { imageUrls };
        }
    }
    
    throw new Error("Image generation timed out. The Stable Horde network is very busy. Please try again in a few minutes.");

  } catch (e: any) {
    console.error("Stable Horde generation failed:", e);
    return { imageUrls: [], error: e.message || 'An unknown error occurred with the Stable Horde service.' };
  }
}

/**
 * Generates images using the free Pollinations AI service.
 */
async function generateWithPollinations(input: GenerateImageInput): Promise<GenerateImageOutput> {
  try {
    const { width, height } = parseAspectRatio(input.aspectRatio);
    const encodedPrompt = encodeURIComponent(input.prompt);

    const generationPromises = Array.from({ length: input.numberOfImages }).map(async (_, i) => {
      try {
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
      } catch (e) {
        console.error("A single Pollinations AI request failed:", e);
        return null;
      }
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
    // It returns the image URL or the last error encountered.
    const tryGenerateOneImage = async (): Promise<{ url: string | null; error: string | null }> => {
        let lastError: string | null = null;
        for (let j = 0; j < apiKeys.length; j++) {
            const currentApiKey = apiKeys[keyIndex % apiKeys.length];
            keyIndex++;
            const hf = new HfInference(currentApiKey);
            const keyIdentifier = `...${currentApiKey.slice(-4)}`;

            try {
                console.log(`Attempting image with key ${keyIdentifier} for model: ${input.model}`);
                const blob = await hf.textToImage({
                    model: input.model,
                    inputs: input.prompt,
                    parameters: {
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
                return { url: dataUri, error: null };

            } catch (e: any) {
                lastError = e.message || 'An unknown API error occurred.';
                if (lastError.includes('is currently loading')) {
                    // This error is fatal for this model at this time, so we throw to stop all parallel attempts for it.
                    throw new Error(`The model '${input.model}' is still loading on the Hugging Face servers. This can take a few minutes. Please try again shortly or select a different model.`);
                }
                console.error(`API key (${keyIdentifier}) failed. Error: ${lastError}. Trying next key.`);
            }
        }
        // If all keys fail for this image generation attempt
        console.error(`Failed to generate an image with any of the available API keys. Last error: ${lastError}`);
        return { url: null, error: lastError };
    };

    try {
        const generationPromises = Array.from({ length: input.numberOfImages }).map(() => tryGenerateOneImage());
        const results = await Promise.all(generationPromises);

        const successfulUrls = results.map(r => r.url).filter((url): url is string => !!url);
        const errors = results.map(r => r.error).filter((err): err is string => !!err);

        if (successfulUrls.length > 0) {
             // Even if some failed, we return the successful ones. The user will see which ones failed to load.
             return { imageUrls: successfulUrls };
        }

        // If all attempts failed, return the first captured error message for clarity.
        if (errors.length > 0) {
            // Provide a more direct and informative error to the user.
            let userFriendlyError = `Hugging Face API Error: ${errors[0]}`;
            if (errors[0].includes("Rate limit reached")) {
                userFriendlyError = "Hugging Face models are currently under very high demand. Please try again in a moment.";
            }
            return { imageUrls: [], error: userFriendlyError };
        }

        // Fallback for an unexpected case where there are no successes and no errors.
        return { imageUrls: [], error: "An unknown error occurred during image generation with Hugging Face." };

    } catch (e: any) {
        // This catches the fatal "model is loading" error thrown from `tryGenerateOneImage`
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
