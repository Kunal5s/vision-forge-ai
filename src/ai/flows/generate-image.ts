
'use server';

/**
 * @fileOverview Image generation flow using Google Imagen 3 API with style customizations.
 * Now generates 5 image variations.
 * - generateImage - A function that generates 5 images based on a prompt and selected styles.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function (now an array of URLs).
 */

import {ai} from '@/ai/genkit';
import {z, type FinishReason} from 'genkit';

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
          model: 'googleai/gemini-2.0-flash-exp', 
          prompt: `${basePrompt}${numImagesToGenerate > 1 && i > 0 ? ` (Variation ${i + 1} of ${numImagesToGenerate})` : ''}`,
          config: {
            responseModalities: ['TEXT', 'IMAGE'], 
          },
        })
      );
    }

    try {
      const results = await Promise.all(generationPromises);
      const imageUrls: string[] = [];
      const detailedFailures: { reason: FinishReason | 'MISSING_MEDIA_URL_OR_CANDIDATE'; message?: string; index: number }[] = [];

      results.forEach((result, index) => {
        if (result.media?.url) {
          imageUrls.push(result.media.url);
        } else {
          // Log detailed information for server-side debugging
          console.warn(`Generation attempt ${index + 1} missing media URL. Full result:`, JSON.stringify(result, null, 2));
          const candidate = result.candidates && result.candidates[0];
          if (candidate) {
            detailedFailures.push({
              index: index + 1,
              reason: candidate.finishReason,
              message: candidate.finishMessage || 'No specific message provided by the model.',
            });
          } else {
            detailedFailures.push({
              index: index + 1,
              reason: 'MISSING_MEDIA_URL_OR_CANDIDATE',
              message: 'Response did not contain a media URL or any content candidates.',
            });
          }
        }
      });
      
      if (imageUrls.length === 0) {
        let reasonSummary = 'All image generation attempts failed.';
        if (detailedFailures.length > 0) {
          reasonSummary += ' Reasons:';
          detailedFailures.forEach(failure => {
            reasonSummary += `\n- Attempt ${failure.index}: ${failure.reason} (${failure.message})`;
          });

          const uniqueFailureReasons = [...new Set(detailedFailures.map(f => f.reason))];
          if (uniqueFailureReasons.includes('SAFETY') || uniqueFailureReasons.includes('BLOCKED')) {
            reasonSummary += '\n\nOne or more attempts were blocked due to "SAFETY" or "BLOCKED" reasons. This often indicates the prompt might have violated content policies or contained sensitive terms.';
          }
        }
        reasonSummary += '\n\nPlease verify the following and try again:\n1. Your prompt is clear and adheres to content policies.\n2. Your API key (`GOOGLE_API_KEY` in .env) is correct, active, and has the necessary permissions.\n3. The "Generative Language API" or "Vertex AI API" is enabled in your Google Cloud project.\n4. Billing is enabled and active for your Google Cloud project.\nReview server logs for more detailed technical information on each failed attempt.';
        
        // This error will be caught by the outer catch and prefixed
        throw new Error(reasonSummary);
      } else if (imageUrls.length < numImagesToGenerate) {
         let failedReasonsInfo = '';
        detailedFailures.forEach(failure => {
            failedReasonsInfo += ` Attempt ${failure.index} failed - Reason: ${failure.reason} (${failure.message}). `;
        });
        console.warn(`Generated ${imageUrls.length} images instead of the requested ${numImagesToGenerate}. Some generations might have failed internally. ${failedReasonsInfo}Review server logs for full details.`);
      }

      return { imageUrls };
    } catch (error) {
      console.error("Error during image generation batch processing:", error);
      // This re-throws the error, potentially the one constructed above or another error from Promise.all
      throw new Error(`Failed to generate image batch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
