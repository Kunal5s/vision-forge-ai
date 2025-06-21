
'use server';

/**
 * @fileOverview Image generation flow using Google's latest image generation model.
 * Generates a single image with enhanced prompting for quality and aspect ratio.
 * - generateImage - A function that generates an image based on a prompt and selected styles.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function, containing an array of URLs or an error.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image. This should include textual hints for aspect ratio.'),
  style: z.enum([
    "3D",
    "8-bit",
    "Abstract",
    "Analogue",
    "Anime",
    "Bokeh",
    "Cartoon",
    "Charcoal Sketch",
    "Claymation",
    "Collage",
    "Cookie",
    "Crayon",
    "Cubism",
    "Cybernetic",
    "Doodle",
    "Dough",
    "Felt",
    "Glitch Art",
    "Illustrated",
    "Impressionism",
    "Knitted",
    "Long Exposure",
    "Low Poly",
    "Macro",
    "Marker",
    "Mechanical",
    "Oil Painting",
    "Origami",
    "Painting",
    "Paper",
    "Photorealistic",
    "Pin",
    "Plushie",
    "Pop Art",
    "Realistic",
    "Stained Glass",
    "Surrealism",
    "Tattoo",
    "Vaporwave",
    "Watercolor",
    "Woodblock",
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
    
    const directives = [
      input.style ? `- Style: ${input.style}` : '',
      input.mood ? `- Mood: ${input.mood}` : '',
      input.lighting ? `- Lighting: ${input.lighting}` : '',
      input.color ? `- Color: ${input.color}` : '',
    ].filter(Boolean).join('\n');

    const basePrompt = `Generate a hyper-realistic, 4k ultra-detailed image.
User Prompt: "${input.prompt}"
${directives ? `\nStrictly adhere to these directives:\n${directives}` : ''}`;


    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: basePrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (media?.url) {
        return { imageUrls: [media.url] };
      }

      // If no media URL, something went wrong. Provide the checklist.
      console.error("Image generation did not return a media URL.");
      const failureReason = "Image generation failed. This might be due to a safety policy violation or a problem with your Google Cloud project configuration. Please check the following and try again:\n\n1. **Billing is enabled** for your Google Cloud project.\n2. The **'Generative Language API'** is enabled.\n3. Your prompt does not violate safety policies.";
      return { imageUrls: [], error: failureReason };


    } catch (e: any) {
      console.error("Image generation API call failed:", e);
      const detailedMessage = "An unexpected error occurred. This is often caused by an incorrect API Key or Google Cloud project setup. Please check the following:\n\n1. Your **GOOGLE_API_KEY** is correct in your Netlify environment variables.\n2. **Billing is enabled** for your Google Cloud project.\n3. The **'Generative Language API'** (or Vertex AI) is enabled in Google Cloud.";
      return { imageUrls: [], error: detailedMessage };
    }
  }
);
