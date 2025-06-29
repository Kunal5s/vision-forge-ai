
'use server';

/**
 * @fileOverview Universal image generation flow that routes to different services.
 * - Routes to Pexels, Google, Pollinations, Stable Horde, and Hugging Face.
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { ALL_MODEL_VALUES, GOOGLE_AI_MODELS, HF_MODELS, POLLINATIONS_MODELS, STABLE_HORDE_MODELS } from '@/lib/constants';

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

  if (GOOGLE_AI_MODELS.some(m => m.value === model)) {
    return generateWithGenkit(input);
  } else if (model === 'imagen-brain-ai') {
    return generateWithPexels(input);
  } else if (POLLINATIONS_MODELS.some(m => m.value === model)) {
    return generateWithPollinations(input);
  } else if (STABLE_HORDE_MODELS.some(m => m.value === model)) {
    return generateWithStableHorde(input);
  } else if (HF_MODELS.some(m => m.value === model)) {
    return generateWithHuggingFace(input);
  } else {
    return { imageUrls: [], error: `Unknown model selected: ${model}` };
  }
}

/**
 * Generates images using Genkit and a Google AI model.
 * Per user request, this model is temporarily free for testing.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithGenkit(input: GenerateImageInput): Promise<GenerateImageOutput> {
  try {
    const generationPromises = Array(input.numberOfImages).fill(0).map(() => 
      ai.generate({
        model: input.model as any,
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const results = await Promise.all(generationPromises);
    
    const imageUrls = results.map(result => {
        if (!result.media?.url) {
            throw new Error("AI model did not return an image.");
        }
        return result.media.url; // This will be a data URI
    });
    
    return { imageUrls };

  } catch (e: any) {
    console.error("Genkit generation failed:", e);
    let detailedMessage = `An unexpected error occurred with the AI model. ${e.message || ''}`;
    if (e.message && (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID'))) {
        detailedMessage = "Image generation failed due to an invalid API key. (For site admins) Please check your GEMINI_API_KEY, ensure billing is enabled for your Google Cloud project, and that the 'Generative Language API' is enabled.";
    }
    return { imageUrls: [], error: detailedMessage };
  }
}


/**
 * Fetches images from Pexels API based on the user's prompt and desired aspect ratio.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithPexels(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY || PEXELS_API_KEY === "YOUR_PEXELS_API_KEY_HERE" || PEXELS_API_KEY === "") {
    return { 
      imageUrls: [], 
      error: "Pexels API key is not configured. For site administrators, please add your PEXELS_API_KEY to the environment variables." 
    };
  }

  try {
    const orientationMap: Record<string, string> = {
      '16:9': 'landscape', '21:9': 'landscape', '3:2': 'landscape', '4:3': 'landscape',
      '9:16': 'portrait', '2:3': 'portrait', '3:4': 'portrait',
      '1:1': 'square',
    };
    const orientation = orientationMap[input.aspectRatio] || 'landscape';

    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(input.prompt)}&per_page=${input.numberOfImages * 5}&orientation=${orientation}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pexels API returned an error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return { imageUrls: [], error: `No photos found for "${input.prompt}". Try a different search term.` };
    }
    
    const imageUrls = data.photos.slice(0, input.numberOfImages).map((photo: any) => photo.src.large2x);

    return { imageUrls };

  } catch (e: any) {
    console.error("Pexels fetch failed:", e);
    return { imageUrls: [], error: e.message || 'An unknown error occurred while fetching images from Pexels.' };
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
            const seed = Math.floor(Math.random() * 10000); // Random seed for variation
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?width=${finalWidth}&height=${finalHeight}&seed=${seed}&nologo=true`;
            return url;
        });
        
        return { imageUrls };
    } catch (e: any) {
        console.error("Pollinations generation failed:", e);
        return { imageUrls: [], error: `An unexpected error occurred with Pollinations: ${e.message}` };
    }
}

/**
 * Generates images using the Stable Horde community-powered network.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithStableHorde(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const API_KEY = process.env.STABLE_HORDE_API_KEY;

  if (!API_KEY || API_KEY === "YOUR_STABLE_HORDE_API_KEY_HERE" || API_KEY.trim() === "") {
    return {
      imageUrls: [],
      error: "Stable Horde API key is not configured. For site administrators, please add your STABLE_HORDE_API_KEY to the environment variables."
    };
  }

  try {
    const [w, h] = input.aspectRatio.split(':').map(Number);
    const scale = Math.sqrt(512 * 768 / (w * h));
    const finalWidth = Math.round(w * scale / 64) * 64;
    const finalHeight = Math.round(h * scale / 64) * 64;

    const imageUrls: string[] = [];
    for (let i = 0; i < input.numberOfImages; i++) {
        const asyncResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": API_KEY, "Client-Agent": "ImagenBrainAI:1.0:tech@firebase.com" },
            body: JSON.stringify({
                prompt: `${input.prompt} ### Steps: 20, Sampler: k_euler_a, CFG Scale: 7`,
                params: { sampler_name: "k_euler_a", steps: 20, n: 1, width: finalWidth, height: finalHeight, cfg_scale: 7 },
                models: ["deliberate", "rev_animated", "dreamshaper", "realisticvision"],
                kudasai: true,
            })
        });

        if (!asyncResponse.ok) {
            const errorData = await asyncResponse.json();
            throw new Error(`Stable Horde submission failed: ${errorData.message}`);
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
                finalResult = statusData.generations[0].img;
                break;
            }
        }
        
        if (finalResult) imageUrls.push(finalResult);
        else throw new Error(`Image generation timed out after 90 seconds. The Stable Horde network is likely very busy.`);
    }
    return { imageUrls };

  } catch (e: any) {
      console.error("Stable Horde generation failed:", e);
      return { imageUrls: [], error: `Stable Horde Error: ${e.message}` };
  }
}

/**
 * Generates images using the Hugging Face Inference API with key rotation.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
async function generateWithHuggingFace(input: GenerateImageInput): Promise<GenerateImageOutput> {
    const keys = Object.entries(process.env).filter(([k]) => k.startsWith('HF_API_KEY_')).map(([, v]) => v).filter(Boolean) as string[];

    if (keys.length === 0) {
        return { imageUrls: [], error: "No Hugging Face API keys configured. (For admins) Please set HF_API_KEY_... variables." };
    }

    try {
        const imageUrls: string[] = [];
        for (let i = 0; i < input.numberOfImages; i++) {
            const key = keys[i % keys.length]; // Rotate keys
            const response = await fetch(`https://api-inference.huggingface.co/models/${input.model}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "x-wait-for-model": "true" },
                body: JSON.stringify({ "inputs": input.prompt }),
            });
            
            if (!response.ok) {
                let errorText;
                try {
                    const errorJson = await response.json();
                    errorText = errorJson.error || `API returned status ${response.status}`;
                } catch (e) {
                    errorText = await response.text();
                }
                throw new Error(errorText);
            }

            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                 throw new Error("Invalid response from API. Expected an image blob.");
            }
            const buffer = Buffer.from(await blob.arrayBuffer());
            const dataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
            imageUrls.push(dataUri);
        }

        return { imageUrls };

    } catch (e: any)
      {
        console.error("Hugging Face generation failed:", e);
        return { imageUrls: [], error: `Hugging Face API Error: ${e.message}` };
    }
}
