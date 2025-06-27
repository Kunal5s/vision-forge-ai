
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
    
    // This check is now primarily for the premium Google model.
    if (!process.env.GOOGLE_API_KEY && !input.prompt.includes('pollinations')) {
      const errorMsg = "Your GOOGLE_API_KEY is not set correctly. Please see deployment documentation.";
      console.error(errorMsg);
      // For Google model, this is a hard failure.
      return { imageUrls: [], error: errorMsg };
    }

    try {
      let generationPromises;
      // Heuristic to check if we're using the premium model based on prompt content
      const isGoogleModel = !input.prompt.toLowerCase().includes('pollinations');
      
      if (isGoogleModel) {
          // Premium model logic
          const enhancedPrompt = `Photorealistic, 4K resolution, ultra-detailed. ${input.prompt}`;
          generationPromises = Array.from({ length: 2 }).map(() => {
              return ai.generate({
                model: 'googleai/gemini-2.0-flash-preview-image-generation',
                prompt: enhancedPrompt,
                config: { responseModalities: ['TEXT', 'IMAGE'] },
              });
          });
      } else {
          // Pollinations (free model) logic
          const encodedPrompt = encodeURIComponent(input.prompt);
          const [aspectW, aspectH] = (input.prompt.match(/(\d+):(\d+)/) || ['1', '1']).slice(1).map(Number);
          
          let width = 1024, height = 1024;
           if (aspectW && aspectH) {
              if (aspectW > aspectH) {
                  width = 1024;
                  height = Math.round((1024 * aspectH) / aspectW);
              } else {
                  height = 1024;
                  width = Math.round((1024 * aspectW) / aspectH);
              }
          }

          const urls = Array.from({ length: 2 }, () => `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 100000)}&nologo=true`);
          
          // Pre-flight check for the first URL to see if service is up
          const testResponse = await fetch(urls[0]);
          if (!testResponse.ok || !testResponse.headers.get('content-type')?.startsWith('image/')) {
            throw new Error('The free image service may be temporarily unavailable or the prompt was unsuitable. Please try again later or with a different prompt.');
          }

          // Return the URLs directly for the frontend to handle
          return { imageUrls: urls };
      }
      
      const results = await Promise.all(generationPromises);

      const imageUrls = results
        .map(result => result.media?.url)
        .filter((url): url is string => !!url);

      if (imageUrls.length > 0) {
        return { imageUrls };
      }
      
      const failureReason = "Image generation failed. This may be a temporary issue with the AI service. Please try again. If the problem persists, check your prompt for any potentially sensitive content.";
      return { imageUrls: [], error: failureReason };

    } catch (e: any) {
      console.error("Image generation API call failed:", e);
      return { imageUrls: [], error: e.message || "An unexpected error occurred during image generation." };
    }
  }
);
