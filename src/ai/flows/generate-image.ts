
'use server';

/**
 * @fileOverview Image generation flow using Google Imagen 3 API with style customizations.
 * Now generates 5 image variations.
 * - generateImage - A function that generates 5 images based on a prompt and selected styles.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function (now an array of URLs).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image. Aspect ratio hints should be included here if desired.'),
  style: z.enum([
    '3D',
    '8-bit',
    'Analogue',
    'Anime',
    'Cartoon',
    'Collage',
    'Cookie',
    'Crayon',
    'Doodle',
    'Dough',
    'Felt',
    'Illustrated',
    'Marker',
    'Mechanical',
    'Painting',
    'Paper',
    'Pin',
    'Plushie',
    'Realistic',
    'Tattoo',
    'Woodblock',
  ]).optional().describe('The style to apply to the image.'),
  mood: z.enum([
    'Sweets',
    'Classical',
    'Cyberpunk',
    'Dreamy',
    'Glowy',
    'Gothic',
    'Kawaii',
    'Mystical',
    'Trippy',
    'Tropical',
    'Steampunk',
    'Wasteland',
  ]).optional().describe('The mood to evoke in the image.'),
  lighting: z.enum(['Bright', 'Dark', 'Neon', 'Sunset', 'Misty', 'Ethereal']).optional().describe('The lighting style for the image.'),
  color: z.enum(['Cool', 'Earthy', 'Indigo', 'Infrared', 'Pastel', 'Warm']).optional().describe('The color palette for the image.'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string().describe('A data URI of a generated image.')).describe('An array of URLs for the generated images.'),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// This function is what Next.js components will call.
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

// This is the Genkit flow that will orchestrate the 5 image generations.
const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    // Construct the base prompt with all details, emphasizing aspect ratio if hinted.
    // The input.prompt from ImageGenerator.tsx already contains the aspect ratio textual hint.
    const basePrompt = `Generate an image based on the following specifications. Pay close attention to any aspect ratio hints (e.g., 'widescreen', 'square', 'portrait') that might be included in the main prompt text.

Prompt: ${input.prompt}
${input.style ? `Style: ${input.style}` : ''}
${input.mood ? `Mood: ${input.mood}` : ''}
${input.lighting ? `Lighting: ${input.lighting}` : ''}
${input.color ? `Color: ${input.color}` : ''}`;

    const generationPromises = [];
    const numImagesToGenerate = 5;

    for (let i = 0; i < numImagesToGenerate; i++) {
      generationPromises.push(
        ai.generate({
          model: 'googleai/gemini-2.0-flash-exp', // Ensure this model is used for image generation
          // Add a slight variation hint for subsequent images if desired, model might ignore it.
          prompt: `${basePrompt}${numImagesToGenerate > 1 && i > 0 ? ` (Variation ${i + 1} of ${numImagesToGenerate})` : ''}`,
          config: {
            responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
          },
        })
      );
    }

    try {
      const results = await Promise.all(generationPromises);
      const imageUrls = results.map(result => {
        if (!result.media?.url) {
          console.warn('A generation result was missing a media URL:', result);
          // Fallback or error handling for a missing URL for one of the images
          // For now, let's filter out undefined URLs, though this might result in fewer than 5 images.
          // Ideally, each should succeed or the whole batch fails more gracefully.
          return null; 
        }
        return result.media.url;
      }).filter(url => url !== null) as string[];
      
      if (imageUrls.length < numImagesToGenerate && imageUrls.length === 0) {
        // If all failed to produce a URL (which is unlikely if one worked), throw an error.
         throw new Error('Failed to generate any image URLs.');
      } else if (imageUrls.length < numImagesToGenerate) {
        console.warn(`Generated ${imageUrls.length} images instead of the requested ${numImagesToGenerate}. Some generations might have failed internally.`);
      }

      return { imageUrls };
    } catch (error) {
      console.error("Error during parallel image generation:", error);
      // Re-throw or handle as appropriate for your application
      throw new Error(`Failed to generate image batch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
