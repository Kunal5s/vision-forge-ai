'use server';

/**
 * @fileOverview Image generation flow using Google Imagen 3 API with style customizations.
 *
 * - generateImage - A function that generates an image based on a prompt and selected styles.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image.'),
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
  imageUrl: z.string().describe('The URL of the generated image as a data URI.'),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const imagePrompt = ai.definePrompt({
  name: 'imagePrompt',
  input: {schema: GenerateImageInputSchema},
  output: {schema: GenerateImageOutputSchema},
  prompt: `Generate an image based on the following specifications:

Prompt: {{{prompt}}}
{{#if style}}Style: {{{style}}}{{/if}}
{{#if mood}}Mood: {{{mood}}}{{/if}}
{{#if lighting}}Lighting: {{{lighting}}}{{/if}}
{{#if color}}Color: {{{color}}}{{/if}}`,
});

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: `Generate an image based on the following specifications:\n\nPrompt: ${input.prompt}\n${input.style ? `Style: ${input.style}` : ''}\n${input.mood ? `Mood: ${input.mood}` : ''}\n${input.lighting ? `Lighting: ${input.lighting}` : ''}\n${input.color ? `Color: ${input.color}` : ''}`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {imageUrl: media.url!};
  }
);
