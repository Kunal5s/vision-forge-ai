
'use server';

/**
 * @fileOverview Image generation flow using Google Imagen 3 API with style customizations.
 * Now generates 1 image.
 * - generateImage - A function that generates 1 image based on a prompt and selected styles.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function (now a single URL).
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
  imageUrl: z.string().describe('A data URI of the generated image.'),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// This function is what Next.js components will call.
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

// This is the Genkit flow that will orchestrate the image generation.
const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const fullPrompt = `Generate an image based on the following specifications. Pay close attention to any aspect ratio hints (e.g., 'widescreen', 'square', 'portrait') that might be included in the main prompt text.

Prompt: ${input.prompt}
${input.style ? `Style: ${input.style}` : ''}
${input.mood ? `Mood: ${input.mood}` : ''}
${input.lighting ? `Lighting: ${input.lighting}` : ''}
${input.color ? `Color: ${input.color}` : ''}`;

    try {
      const result = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: fullPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (result.media?.url) {
        return { imageUrl: result.media.url };
      } else {
        let failureReason = 'Image generation failed to produce a media URL.';
        const candidate = result.candidates && result.candidates[0];
        if (candidate) {
          failureReason += ` Reason: ${candidate.finishReason} (${candidate.finishMessage || 'No specific message provided by the model.'}).`;
           if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
            failureReason += ' This often indicates the prompt might have violated content policies or contained sensitive terms.';
          }
        } else {
            failureReason += ' Response did not contain a media URL or any content candidates.';
        }
        
        const detailedErrorMessage = `Failed to generate any image URLs. ${failureReason}\n\nPlease verify the following and try again:\n1. Your prompt is clear and adheres to content policies.\n2. Your API key (\`GOOGLE_API_KEY\` in .env) is correct, active, and has the necessary permissions.\n3. The "Generative Language API" or "Vertex AI API" is enabled in your Google Cloud project.\n4. Billing is enabled and active for your Google Cloud project.\nReview server logs for more detailed technical information on the failed attempt.`;

        console.error("Image generation failure details:", detailedErrorMessage, "Full API result:", JSON.stringify(result, null, 2));
        throw new Error(detailedErrorMessage);
      }
    } catch (error) {
      console.error("Error during image generation processing:", error);
      // Re-throw error, potentially the one constructed above or another error
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
