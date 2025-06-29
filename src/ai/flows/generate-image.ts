
'use server';

/**
 * @fileOverview Universal image generation flow that routes to different services.
 * This file has been rewritten for maximum robustness and provides clear, actionable error messages.
 * - Routes to Pexels, Pollinations, Stable Horde and Hugging Face.
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ALL_MODEL_VALUES, HUGGING_FACE_MODELS, POLLINATIONS_MODELS, STABLE_HORDE_MODELS } from '@/lib/constants';

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
  } else if (HUGGING_FACE_MODELS.some(m => m.value === model)) {
    return generateWithHuggingFace(input);
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
 * Generates images using the Pollinations AI service.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithPollinations(input: GenerateImageInput): Promise<GenerateImageOutput> {
    try {
        const [width, height] = input.aspectRatio.split(':').map(Number);
        const scaleFactor = 1024 / Math.max(width, height);
        const finalWidth = Math.round(width * scaleFactor);
        const finalHeight = Math.round(height * scaleFactor);

        const imageUrls = Array(input.numberOfImages).fill(0).map(() => {
            const seed = Math.floor(Math.random() * 10000);
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
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithStableHorde(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const API_KEY = process.env.STABLE_HORDE_API_KEY;

  if (!API_KEY || API_KEY.trim() === "" || API_KEY.trim() === "0000000000") {
    return {
      imageUrls: [],
      error: "As the site administrator, please go to your Cloudflare project settings, find 'Environment variables', add a variable named 'STABLE_HORDE_API_KEY' with your key, and then redeploy your project."
    };
  }

  try {
    const [w, h] = input.aspectRatio.split(':').map(Number);
    const targetArea = 512 * 768;
    const scale = Math.sqrt(targetArea / (w * h));
    const finalWidth = Math.round(w * scale / 64) * 64;
    const finalHeight = Math.round(h * scale / 64) * 64;

    const fullPrompt = `(best quality, masterpiece, highres, photorealistic), ${input.prompt} ### (deformed, blurry, bad anatomy, low quality, worst quality, watermark, signature)`;

    const imageUrls: string[] = [];
    for (let i = 0; i < input.numberOfImages; i++) {
        const asyncResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": API_KEY, "Client-Agent": "ImagenBrainAI:1.0:tech@firebase.com" },
            body: JSON.stringify({
                prompt: fullPrompt,
                params: { sampler_name: "k_euler_a", steps: 25, n: 1, width: finalWidth, height: finalHeight, cfg_scale: 7.5 },
                models: ["Deliberate", "dreamshaper_8", "rev_animated"],
                kudosai: true,
            })
        });

        if (!asyncResponse.ok) {
            if (asyncResponse.status === 401) {
                throw new Error(`Stable Horde error (401 Unauthorized): The API key is invalid. Please go to your Cloudflare project settings, check the value of 'STABLE_HORDE_API_KEY', and redeploy.`);
            }
            const errorData = await asyncResponse.json();
            throw new Error(`Stable Horde submission failed: ${errorData.message || 'Unknown error'}`);
        }
        
        const asyncData = await asyncResponse.json();
        const { id } = asyncData;
        if (!id) throw new Error("Stable Horde did not return a job ID.");
        
        let finalResult = null;
        const startTime = Date.now();
        while (Date.now() - startTime < 90000) { // 90 second timeout
            await new Promise(resolve => setTimeout(resolve, 5000));
            const checkResponse = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`);
            const checkData = await checkResponse.json();

            if (checkData.done) {
                const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
                const statusData = await statusResponse.json();
                if (statusData.generations && statusData.generations.length > 0) {
                    finalResult = statusData.generations[0].img;
                }
                break;
            }
        }
        
        if (finalResult) {
            imageUrls.push(finalResult);
        } else {
            throw new Error(`Image generation timed out after 90 seconds. The Stable Horde network is likely very busy or could not complete your request.`);
        }
    }
    return { imageUrls };

  } catch (e: any) {
      console.error("Stable Horde generation failed:", e);
      return { imageUrls: [], error: `Stable Horde Error: ${e.message}` };
  }
}

/**
 * Generates images using various models from the Hugging Face Inference API.
 * This function now includes robust key rotation and detailed error handling.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithHuggingFace(input: GenerateImageInput): Promise<GenerateImageOutput> {
    const MAX_KEYS = 10;
    const keys = [];
    for (let i = 1; i <= MAX_KEYS; i++) {
        const key = process.env['HF_API_KEY_' + i];
        if (key) keys.push(key);
    }

    if (keys.length === 0) {
        return {
            imageUrls: [],
            error: "As the site administrator, please go to your Cloudflare project settings, find 'Environment variables', add at least one variable named 'HF_API_KEY_1' with your key, and then redeploy your project. You can add up to 10 keys (HF_API_KEY_1 to HF_API_KEY_10)."
        };
    }

    const imageUrls: string[] = [];
    let lastError: string | null = null;
    let keyIndex = 0;

    const fullPrompt = `(best quality, masterpiece, highres, photorealistic), ${input.prompt}`;
    const negativePrompt = "(deformed, blurry, bad anatomy, low quality, worst quality, watermark, signature, ugly)";

    for (let i = 0; i < input.numberOfImages; i++) {
        let attempts = 0;
        let success = false;
        while (attempts < keys.length && !success) {
            const currentKey = keys[keyIndex];
            try {
                const response = await fetch(
                    `https://api-inference.huggingface.co/models/${input.model}`,
                    {
                        headers: { Authorization: `Bearer ${currentKey}` },
                        method: "POST",
                        body: JSON.stringify({
                            inputs: fullPrompt,
                            parameters: { negative_prompt: negativePrompt },
                            options: { wait_for_model: true }
                        }),
                    }
                );

                if (response.ok) {
                    const blob = await response.blob();
                    if (blob.type.startsWith('image/')) {
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        imageUrls.push(dataUrl);
                        success = true;
                    } else {
                        // Handle cases where the API returns a JSON error instead of an image
                        const errorJson = JSON.parse(await blob.text());
                        throw new Error(errorJson.error || "API returned non-image data.");
                    }
                } else {
                     if (response.status === 401) {
                        lastError = `Hugging Face error (401 Unauthorized): The API key is invalid or your account doesn't have access to this model. Please check your HF_API_KEY variables in Cloudflare. For some models (like Stable Diffusion), you may need to accept the terms on the Hugging Face model page first.`;
                    } else if (response.status === 404) {
                        lastError = `Model not found (404). The model '${input.model}' may be offline, invalid, or requires a Pro subscription on Hugging Face. Please try a different model.`;
                    } else if (response.status === 429) {
                        lastError = `Hugging Face rate limit hit for key #${keyIndex + 1}. Trying next key.`;
                    } else if (response.status === 503) {
                        lastError = `The model '${input.model}' is currently loading on Hugging Face. This can take a few minutes. Please try again shortly.`;
                    } else {
                         try {
                            const errorText = await response.text();
                            lastError = `Hugging Face API Error on model '${input.model}': API returned status ${response.status} with response: ${errorText}`;
                        } catch (e) {
                             lastError = `Hugging Face API Error on model '${input.model}': API returned status ${response.status} with non-JSON response.`;
                        }
                    }
                    throw new Error(lastError);
                }
            } catch (e: any) {
                lastError = e.message;
                console.error(`Attempt with key ${keyIndex + 1} failed for image ${i + 1}:`, lastError);
                keyIndex = (keyIndex + 1) % keys.length; // Rotate to the next key
                attempts++;
            }
        }
        if (!success) {
            // If all keys failed for one image, stop trying for more images
            return { imageUrls, error: `Failed to generate image after trying all ${keys.length} API keys. Last error: ${lastError}` };
        }
    }

    if (imageUrls.length > 0) {
        return { imageUrls };
    } else {
        return { imageUrls: [], error: lastError || 'An unknown error occurred with Hugging Face.' };
    }
}
