'use server';
/**
 * @fileOverview A powerful, multi-model image generation flow.
 * It can route requests to Google Gemini, Pollinations, or Hugging Face.
 * - generateImage - The core server action for image generation.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt for the image.'),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  numberOfImages: z.number().min(1).max(4).describe('The number of images to generate (max 4).'),
  model: z.string().describe('The AI model to use for generation (e.g., google, pollinations).'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of base64 data URIs of the generated images.'),
  error: z.string().optional().describe('An error message if the generation failed.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


/**
 * Generates images using Google's Gemini model via Genkit.
 * This is the premium, high-quality option.
 */
async function generateWithGoogle(input: GenerateImageInput): Promise<string[]> {
  // Add aspect ratio information directly into the prompt for the AI to follow.
  const fullPrompt = `${input.prompt}, aspect ratio ${input.aspectRatio}`;

  // Check for API key presence before making the call.
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Google API key is missing. Please set GOOGLE_API_KEY in your environment variables to use this model.');
  }

  const generationPromises = Array.from({ length: input.numberOfImages }, () =>
    ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: fullPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    })
  );

  const results = await Promise.all(generationPromises);

  return results.map(result => {
    if (!result.media?.url) {
      throw new Error('Image generation succeeded but the result was empty. This may be due to a safety policy violation. Please try a different prompt.');
    }
    return result.media.url;
  });
}

/**
 * Utility to calculate image dimensions from an aspect ratio string.
 */
function getDimensionsFromRatio(ratio: string, baseSize = 1024): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  // Default to square if ratio is invalid
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) {
      return { width: 1024, height: 1024 };
  }

  // Calculate dimensions based on the longest side being `baseSize`
  if (w > h) {
    return {
      width: baseSize,
      height: Math.round((baseSize * h) / w),
    };
  } else {
    return {
      width: Math.round((baseSize * w) / h),
      height: baseSize,
    };
  }
}

/**
 * Generates images using the free Pollinations API.
 * This is a fast, key-less option for creative exploration.
 */
async function generateWithPollinations(input: GenerateImageInput): Promise<string[]> {
  const imageUrls: string[] = [];
  const { width, height } = getDimensionsFromRatio(input.aspectRatio);

  // By adding width, height, and nofeed=true, we get better control and remove the watermark.
  const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}`;

  // This sequential loop prevents hitting rate limits (like 429 errors) when generating multiple images.
  for (let i = 0; i < input.numberOfImages; i++) {
    // Add a random seed for variation in each image
    const seed = Math.floor(Math.random() * 100000);
    const url = `${baseUrl}?width=${width}&height=${height}&seed=${seed}&nofeed=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
        // Throw an error that will be caught by the main try-catch block
        throw new Error(`Pollinations API returned status ${response.status} for image ${i + 1}`);
    }
    
    // Convert image response to a base64 data URI to avoid client-side CORS issues.
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    imageUrls.push(`data:${mimeType};base64,${base64}`);
  }
  return imageUrls;
}

/**
 * Generates images using the Hugging Face Inference API.
 * This provides an alternative creative model.
 */
async function generateWithHuggingFace(input: GenerateImageİnput): Promise<string[]> {
  const apiKey = process.env.HUGGINGFACE_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key is missing. Please set HUGGINGFACE_KEY in your environment variables.');
  }

  const imageUrls: string[] = [];
  const fullPrompt = `${input.prompt}, aspect ratio ${input.aspectRatio}`;

  for (let i = 0; i < input.numberOfImages; i++) {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: JSON.stringify({ inputs: fullPrompt }),
      }
    );

    if (response.status === 503) {
      throw new Error('Hugging Face model is currently loading, please try again in a moment.');
    }
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Hugging Face API Error: ${errorBody.error || `Status ${response.status}`}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    imageUrls.push(`data:${mimeType};base64,${base64}`);
  }
  return imageUrls;
}


/**
 * Main server action to generate images. It routes the request to the
 * appropriate generation function based on the selected model.
 * @param input The generation parameters from the frontend.
 * @returns A promise that resolves to the generation output.
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  try {
    let imageUrls: string[];

    switch (input.model) {
      case 'google':
        imageUrls = await generateWithGoogle(input);
        break;
      case 'pollinations':
        imageUrls = await generateWithPollinations(input);
        break;
      case 'huggingface':
        imageUrls = await generateWithHuggingFace(input);
        break;
      default:
        throw new Error(`Invalid model selected: ${input.model}`);
    }

    return { imageUrls };

  } catch (e: any) {
    console.error("Image generation failed:", e);
    
    let errorMessage = e.message || "An unexpected error occurred. Please try again later.";
    if (e.message?.includes('API key')) {
        errorMessage = e.message;
    } else if (e.message?.includes('billing')) {
        errorMessage = "Image generation failed. Please check if billing is enabled for your Google Cloud project.";
    }

    return { imageUrls: [], error: errorMessage };
  }
}
