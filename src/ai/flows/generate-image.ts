
'use server';

/**
 * @fileOverview Image generation flow using Google's latest image generation model.
 * Generates multiple image variations with enhanced prompting for quality and aspect ratio.
 * - generateImage - A function that generates images based on a prompt and selected styles.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function, containing an array of URLs or an error.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image. This should include textual hints for aspect ratio.'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of data URIs of the generated images.'),
  error: z.string().optional().describe('An error message if the generation failed.'),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input): Promise<GenerateImageOutput> => {
    
    if (!process.env.GOOGLE_API_KEY) {
      const errorMsg = "Your GOOGLE_API_KEY is not set correctly for deployment. Please go to your Netlify site settings under 'Build & deploy' > 'Environment' and add your API key. The key should not be public.";
      console.error(errorMsg);
      return { imageUrls: [], error: errorMsg };
    }

    try {
      // Enhance the prompt with quality modifiers for 4K, detailed output.
      const enhancedPrompt = `Photorealistic, 4K resolution, ultra-detailed, intricate textures, professional lighting, masterpiece quality. ${input.prompt}`;

      // Create 2 promises for 2 image generation calls in parallel for variations.
      const generationPromises = Array.from({ length: 2 }).map(() => {
        return ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: enhancedPrompt, // Use the enhanced prompt for higher quality.
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
      });
      
      // Await all promises to resolve
      const results = await Promise.all(generationPromises);

      const imageUrls = results
        .map(result => result.media?.url)
        .filter((url): url is string => !!url);


      if (imageUrls.length > 0) {
        return { imageUrls };
      }
      
      console.error("Image generation did not return any media URLs.");
      const failureReason = "Image generation failed. This is often a Google Cloud setup issue. Please check:\n1. **Billing is enabled** for your Google Cloud project.\n2. The **'Generative Language API'** is enabled.";
      return { imageUrls: [], error: failureReason };


    } catch (e: any) {
      console.error("Image generation API call failed:", e);
      const detailedMessage = "An unexpected error occurred. This is often a Google Cloud setup issue. Please check:\n1. **Billing is enabled** for your Google Cloud project.\n2. The **'Generative Language API'** is enabled.";
      return { imageUrls: [], error: detailedMessage };
    }
  }
);
