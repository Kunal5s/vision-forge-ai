
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
  prompt: z.string().describe('The prompt for generating the image.'),
  plan: z.enum(['free', 'pro', 'mega']).describe("The user's current subscription plan."),
  aspectRatio: z.string().describe("The desired aspect ratio, e.g., '16:9'."),
  model: z.enum(['pollinations', 'google']).describe('The selected generation model.'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of data URIs of the generated images.'),
  error: z.string().optional().describe('An error message if the generation failed.'),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

/**
 * Calculates the optimal width and height for image generation based on aspect ratio,
 * ensuring dimensions are multiples of 64px to maintain compatibility with AI models.
 *
 * @param aspectRatio The desired aspect ratio as a string (e.g., "16:9").
 * @param plan The user's current subscription plan, which determines the max dimension.
 * @returns An object containing the calculated width and height.
 */
function calculateDimensions(aspectRatio: string, plan: 'free' | 'pro' | 'mega'): { width: number, height: number } {
    const [aspectW, aspectH] = aspectRatio.split(':').map(Number);
    const maxDimension = (plan === 'pro' || plan === 'mega') ? 1024 : 512;

    if (isNaN(aspectW) || isNaN(aspectH) || aspectW <= 0 || aspectH <= 0) {
        return { width: maxDimension, height: maxDimension };
    }

    const ratio = aspectW / aspectH;
    let width: number, height: number;

    if (ratio > 1) { // Landscape
        width = maxDimension;
        height = Math.round(width / ratio);
    } else { // Portrait or Square
        height = maxDimension;
        width = Math.round(height * ratio);
    }

    // Ensure final dimensions are multiples of 64
    width = Math.max(64, Math.round(width / 64) * 64);
    height = Math.max(64, Math.round(height / 64) * 64);
    
    return { width, height };
}


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
    
    try {
      // Use the selected model to determine the generation path.
      if (input.model === 'google') {
          // This is the premium path. It requires a paid plan.
          if (input.plan === 'free') {
              const errorMsg = "You must have a Pro or Mega plan to use the premium VisionForge AI model. Please upgrade your plan.";
              console.error(errorMsg);
              return { imageUrls: [], error: errorMsg };
          }
          if (!process.env.GOOGLE_API_KEY) {
            const errorMsg = "The site administrator has not configured the GOOGLE_API_KEY. This is required for premium features. Please add it to your deployment environment's settings (e.g., in Cloudflare, Vercel, or Netlify) to enable premium models.";
            console.error(errorMsg);
            return { imageUrls: [], error: errorMsg };
          }
          
          const isMega = input.plan === 'mega';
          const candidates = isMega ? 4 : 2; // Mega users get 4 variations
          
          // Prepend a quality modifier to the already detailed prompt from the frontend
          const enhancedPrompt = `Masterpiece, best quality, cinematic, ultra-high resolution. ${input.prompt}`;

          const { width, height } = calculateDimensions(input.aspectRatio, input.plan);

          const result = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: enhancedPrompt,
            config: { 
                responseModalities: ['TEXT', 'IMAGE'],
                candidates: candidates, // Use dynamic candidate count
                height: height,
                width: width,
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

      } else { // This block is now for 'pollinations' model, regardless of plan.
          // Free/Standard plan logic (1 image via Pollinations)
          const encodedPrompt = encodeURIComponent(input.prompt);
          
          // Always use 'free' plan dimensions for Pollinations as it has its own limits.
          const { width, height } = calculateDimensions(input.aspectRatio, 'free');

          const urls = [`https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 100000)}&nologo=true`];
          
          return { imageUrls: [urls[0]] };
      }
      
    } catch (e: any) {
      console.error("Image generation API call failed:", e);
      const detailedMessage = "An unexpected error occurred with the image generator. For site administrators, please check:\n1. Your GOOGLE_API_KEY is set correctly.\n2. Billing is enabled for your Google Cloud project.\n3. The 'Generative Language API' is enabled in your project.";
      return { imageUrls: [], error: detailedMessage };
    }
  }
);
