
'use server';

/**
 * @fileOverview Universal image generation flow that routes to different services.
 * This file has been rewritten for maximum robustness, removing Hugging Face and focusing on performance and clear error messages.
 * - Routes to Pexels, Pollinations, and Stable Horde.
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ALL_MODEL_VALUES, POLLINATIONS_MODELS, STABLE_HORDE_MODELS } from '@/lib/constants';

// Input schema defines the data structure sent from the frontend.
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The search query for fetching images.'),
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  model: z.enum(ALL_MODEL_VALUES).describe('The selected model identifier.'),
  numberOfImages: z.number().min(1).max(6).describe('The number of images to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Output schema defines the data structure returned to the frontend.
const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of URLs of the fetched images.'),
  error: z.string().optional().describe('An error message if the fetch failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


/**
 * Main function to delegate image generation based on the selected model.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const model = input.model;

  if (model === 'imagen-brain-ai') {
    return generateWithPexels(input);
  } else if (POLLINATIONS_MODELS.some(m => m.value === model)) {
    return generateWithPollinations(input);
  } else if (STABLE_HORDE_MODELS.some(m => m.value === model)) {
    return generateWithStableHorde(input);
  } else {
    return { imageUrls: [], error: `Unknown model selected: ${model}` };
  }
}


/**
 * Fetches real photos from Pexels based on the user's prompt. This is a search, not an AI generation.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithPexels(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY || PEXELS_API_KEY.trim() === "") {
    return { 
      imageUrls: [], 
      error: "As the site administrator, please go to your Cloudflare project settings, find 'Environment variables', add a variable named 'PEXELS_API_KEY' with your key, and then redeploy your project."
    };
  }

  try {
    const orientationMap: Record<string, string> = {
      '1:1': 'square',
      '16:9': 'landscape', '21:9': 'landscape', '3:2': 'landscape', '4:3': 'landscape', '2:1': 'landscape', '3:1': 'landscape',
      '9:16': 'portrait', '2:3': 'portrait', '3:4': 'portrait', '5:4': 'portrait',
    };
    const orientation = orientationMap[input.aspectRatio] || 'landscape';

    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(input.prompt)}&per_page=${input.numberOfImages * 5}&orientation=${orientation}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!response.ok) {
      if (response.status === 401) {
          throw new Error(`Pexels API error (401 Unauthorized): The API key is invalid or has a typo. Please go to your Cloudflare project settings, double-check the value of 'PEXELS_API_KEY', and redeploy.`);
      }
      const errorText = await response.text();
      throw new Error(`Pexels API returned an error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return { imageUrls: [], error: `We couldn't find any real photos matching "${input.prompt}". Try a different search term.` };
    }
    
    const imageUrls = data.photos.slice(0, input.numberOfImages).map((photo: any) => photo.src.large2x);

    return { imageUrls };

  } catch (e: any) {
    console.error("Pexels fetch failed:", e);
    return { imageUrls: [], error: e.message || 'An unknown error occurred while searching for photos on Pexels.' };
  }
}

/**
 * Generates images using the Pollinations AI service. This is the fastest AI option.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithPollinations(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
        const [width, height] = input.aspectRatio.split(':').map(Number);
        // Optimized for faster generation on Pollinations.
        const scaleFactor = 1024 / Math.max(width, height);
        const finalWidth = Math.round(width * scaleFactor);
        const finalHeight = Math.round(height * scaleFactor);

        const imageUrls = Array(input.numberOfImages).fill(0).map(() => {
            const seed = Math.floor(Math.random() * 10000);
            // The prompt is already enhanced with styles/moods from the frontend.
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?width=${finalWidth}&height=${finalHeight}&seed=${seed}&nologo=true`;
            return url;
        });
        
        return { imageUrls };
    } catch (e: any) {
        console.error("Pollinations generation failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred with the Pollinations service: ${e.message}. The service may be temporarily down.` };
    }
}

/**
 * Generates images using the Stable Horde community-powered network.
 * This function has been heavily optimized for reliability and clear feedback.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithStableHorde(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const API_KEY = process.env.STABLE_HORDE_API_KEY;

  if (!API_KEY || API_KEY.trim() === "" || API_KEY.trim() === "0000000000") {
    return {
      imageUrls: [],
      error: "As the site administrator, please go to your Cloudflare project settings, find 'Environment variables', add a variable named 'STABLE_HORDE_API_KEY' with your key (even '0000000000' for anonymous mode), and then redeploy your project."
    };
  }

  try {
    const [w, h] = input.aspectRatio.split(':').map(Number);
    // Optimized dimensions for common Stable Diffusion models.
    const targetArea = 512 * 768; 
    const scale = Math.sqrt(targetArea / (w * h));
    const finalWidth = Math.round(w * scale / 64) * 64;
    const finalHeight = Math.round(h * scale / 64) * 64;

    // The prompt from the input already includes style/mood enhancements.
    // Adding a strong negative prompt to force better quality.
    const fullPrompt = `(best quality, masterpiece, highres, photorealistic), ${input.prompt} ### (deformed, blurry, bad anatomy, low quality, worst quality, watermark, signature, text, jpeg artifacts)`;

    const imageUrls: string[] = [];
    // Force generation for each requested image sequentially to ensure we get results.
    for (let i = 0; i < input.numberOfImages; i++) {
        const asyncResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": API_KEY, "Client-Agent": "ImagenBrainAI:1.0:tech@firebase.com" },
            body: JSON.stringify({
                prompt: fullPrompt,
                params: { 
                    sampler_name: "k_euler_a", 
                    steps: 25, 
                    n: 1, 
                    width: finalWidth, 
                    height: finalHeight, 
                    cfg_scale: 7.5,
                },
                // Using a broad range of popular models to increase success rate.
                models: ["Deliberate", "dreamshaper_8", "rev_animated", "AnythingV5", "animevae"], 
                kudosai: true,
            })
        });

        if (!asyncResponse.ok) {
            if (asyncResponse.status === 401) {
                throw new Error(`Stable Horde error (401 Unauthorized): The API key is invalid. Please go to your Cloudflare project settings, check the value of 'STABLE_HORDE_API_KEY', and redeploy.`);
            }
            const errorData = await asyncResponse.json();
            throw new Error(`Stable Horde submission failed: ${errorData.message || 'The service rejected the request.'}`);
        }
        
        const asyncData = await asyncResponse.json();
        const { id } = asyncData;
        if (!id) throw new Error("Stable Horde did not return a job ID. The service may be overloaded.");
        
        let finalResult = null;
        const startTime = Date.now();
        // Polling logic to wait for the image to be generated.
        while (Date.now() - startTime < 90000) { // 90 second timeout per image
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
            const checkResponse = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`);
            const checkData = await checkResponse.json();

            if (checkData.done) {
                const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
                const statusData = await statusResponse.json();
                if (statusData.generations && statusData.generations.length > 0 && !statusData.faulted) {
                    finalResult = statusData.generations[0].img;
                } else if(statusData.faulted) {
                     throw new Error(`The generation job failed on the Stable Horde network. This is usually a temporary issue. Please try again.`);
                }
                break; // Exit loop once done.
            }
        }
        
        if (finalResult) {
            imageUrls.push(finalResult);
        } else {
            // This is a critical error message for the user.
            throw new Error(`Image generation timed out after 90 seconds. Stable Horde is a free, community-run service and is likely experiencing high traffic. Please try again in a few minutes or select a different model like Pollinations for faster results.`);
        }
    }
    return { imageUrls };

  } catch (e: any) {
      console.error("Stable Horde generation failed:", e);
      // Ensure any error is passed to the frontend clearly.
      return { imageUrls: [], error: `Stable Horde Error: ${e.message}` };
  }
}

    