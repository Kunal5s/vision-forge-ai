
'use server';

/**
 * @fileOverview Image generation flow that securely calls backend APIs using environment variables.
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

// Helper to calculate dimensions based on aspect ratio
function getDimensions(aspectRatio: string): { width: number; height: number } {
  const [w, h] = aspectRatio.split(':').map(Number);
  // Using a smaller base resolution for free models to improve speed and reduce load
  const basePixels = 1024 * 768; 
  const ratio = w / h;

  let height = Math.sqrt(basePixels / ratio);
  let width = height * ratio;

  // Snap to the nearest multiple of 8 or 64 for model compatibility
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

/**
 * Generates an image using the Hugging Face Inference API with key rotation.
 */
async function generateWithHuggingFace(input: GenerateImageInput): Promise<GenerateImageOutput> {
  // This is a more resilient way to get keys in various environments.
  const hfApiKeys: string[] = [
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
    process.env.HF_API_KEY,
  ].filter((key): key is string => !!key && key.trim() !== '');

  // We no longer return an error if no keys are found. Instead, we let the fetch fail.
  // This provides a better diagnostic error from the Hugging Face API itself (e.g., 401 Unauthorized).
  const apiKey = hfApiKeys.length > 0 ? hfApiKeys[Math.floor(Math.random() * hfApiKeys.length)] : undefined;
  
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
        
        // Provide a clearer error message for the most common failure case.
        if (response.status === 401) {
             return { imageUrls: [], error: 'Authentication failed. For site administrators: Please ensure your Hugging Face API keys (HF_API_KEY or HF_API_KEY_1, etc.) are correctly configured in your deployment environment.' };
        }

        try {
            const errorJson = await response.json();
            if(errorJson.error) {
                if (typeof errorJson.error === 'string' && errorJson.error.includes("is currently loading")) {
                    errorBody = `The model "${input.model}" is currently loading. This can take several minutes for large models. Please try again later.`
                } else {
                    errorBody = `API Error: ${errorJson.error}`;
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
