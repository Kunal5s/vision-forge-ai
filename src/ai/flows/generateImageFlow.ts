'use server';

import {ai} from '@/ai/genkit';

/**
 * Generates an image using Google's Gemini model and returns it as a data URI.
 * @param prompt The text prompt to generate the image from.
 * @returns A promise that resolves to the data URI of the generated image.
 */
export async function generateImageWithGoogle(prompt: string): Promise<string> {
  try {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Google Gemini did not return an image. The prompt may have been blocked by safety filters.');
    }
    
    return media.url; // This is already a data URI
  } catch (error: any) {
    console.error("[GEMINI_API_ERROR]", error);
    // This ensures a clear, catchable error is sent back to the API route.
    throw new Error(`Google Gemini API Error: ${error.message || 'An unknown error occurred.'}`);
  }
}
