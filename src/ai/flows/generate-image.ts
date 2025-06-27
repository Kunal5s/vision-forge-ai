
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
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
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
    
    if (input.plan !== 'free' && !process.env.GOOGLE_API_KEY) {
      const errorMsg = "The site administrator has not configured the Google API Key. Premium models are unavailable.";
      console.error(errorMsg);
      return { imageUrls: [], error: errorMsg };
    }

    try {
      if (input.plan === 'pro' || input.plan === 'mega') {
          // Premium model logic for Pro and Mega plans (2 images)
          const promptEnhancement = input.plan === 'mega'
            ? "Masterpiece, best quality, professional photograph, cinematic lighting, ultra-high resolution, 8k."
            : "Photorealistic, highly detailed, professional quality, 4k.";
            
          // Create a more direct and reliable prompt that explicitly states the aspect ratio.
          const enhancedPrompt = `A ${input.aspectRatio} aspect ratio image of: ${input.prompt}. Style: ${promptEnhancement}`;

          // Generate 2 images in a single, more efficient API call.
          const result = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: enhancedPrompt,
            config: { 
                responseModalities: ['TEXT', 'IMAGE'],
                candidates: 2 // Ask for 2 image candidates
            },
          });

          const imageUrls = result.candidates
            .map(candidate => candidate.media?.url)
            .filter((url): url is string => !!url);
            
          if (imageUrls.length > 0) {
            return { imageUrls };
          }
      
          const failureReason = "Premium image generation failed. This could be due to a few reasons:\n1. Your prompt may have triggered a safety filter. Please try a different prompt.\n2. There might be a temporary issue with the AI service.\n3. (For site admins) Ensure your Google Cloud project has billing enabled and the 'Generative Language API' is active.";
          return { imageUrls: [], error: failureReason };

      } else {
          // Free plan logic (1 image)
          const encodedPrompt = encodeURIComponent(input.prompt);
          
          const [aspectW, aspectH] = (input.aspectRatio.split(':').map(Number) || [1, 1]);

          // Lower resolution for free plan for significantly faster generation and loading.
          const maxDimension = 512;
          let width = maxDimension;
          let height = maxDimension;

          // Calculate dimensions and round to nearest 64 to improve API compatibility
          if (aspectW && aspectH && !isNaN(aspectW) && !isNaN(aspectH) && aspectW > 0 && aspectH > 0) {
              if (aspectW > aspectH) {
                  width = maxDimension;
                  height = Math.round( (maxDimension * aspectH) / aspectW );
              } else if (aspectH > aspectW) {
                  height = maxDimension;
                  width = Math.round( (maxDimension * aspectW) / aspectH );
              }
              // Round to nearest 64 for better compatibility
              width = Math.max(64, Math.round(width / 64) * 64);
              height = Math.max(64, Math.round(height / 64) * 64);
          }

          const urls = [`https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 100000)}&nologo=true`];
          
          return { imageUrls: urls };
      }
      
    } catch (e: any) {
      console.error("Image generation API call failed:", e);
      const detailedMessage = "An unexpected error occurred with the premium image generator. For site administrators, please check:\n1. Your GOOGLE_API_KEY is set correctly.\n2. Billing is enabled for your Google Cloud project.\n3. The 'Generative Language API' is enabled in your project.";
      return { imageUrls: [], error: detailedMessage };
    }
  }
);
