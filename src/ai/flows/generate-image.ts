
'use server';

/**
 * @fileOverview Image generation flow using Google's latest image generation model.
 * Generates a single image with enhanced prompting for quality and aspect ratio.
 * - generateImage - A function that generates an image based on a prompt and selected styles.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function, containing an array of URLs.
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
  async (input) => {
    if (!process.env.GOOGLE_API_KEY) {
      const errorMessage = 'The GOOGLE_API_KEY environment variable is not set. Please add it to your deployment settings and redeploy.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const basePrompt = `You are a world-class expert image generation AI, renowned for creating breathtaking and flawless visuals. Your task is to generate an image based on the following specifications, with strict adherence to all provided directives.

**Primary Goal:** Generate an image that strictly adheres to the requested aspect ratio hint included in the User Prompt (e.g., 'widescreen', 'portrait'). The final image's dimensions must match this ratio as closely as possible. This is a critical technical requirement.

**Quality Mandate:** Create a masterpiece of the highest possible quality. The image must be hyper-realistic, tack-sharp, and filled with intricate details. Aim for a 4K ultra-detailed look with cinematic lighting and professional photography standards. This quality goal should be overridden only if a non-photorealistic style (like 'Cartoon' or '8-bit') is explicitly requested.

**User Prompt:** "${input.prompt}"

${input.style || input.mood || input.lighting || input.color ? '**Mandatory Directives (Non-Negotiable):**' : ''}
${input.style ? `\n- **Artistic Style:** The image's style MUST be **${input.style}**. This directive must define the entire visual language of the image. Do not deviate.` : ''}
${input.mood ? `\n- **Overall Mood:** The mood MUST be **${input.mood}**. This must influence the colors, lighting, and subject's expression.` : ''}
${input.lighting ? `\n- **Lighting Scheme:** The lighting MUST be **${input.lighting}**. This is a critical component of the scene's atmosphere and must be clearly visible.` : ''}
${input.color ? `\n- **Color Palette:** The dominant color palette MUST be **${input.color}**. All colors in the image must harmonize with this directive.` : ''}

**Final Command:** Synthesize ALL of the above requirements—User Prompt (including the aspect ratio hint), the Quality Mandate, and all Mandatory Directives—into a single, cohesive, and stunning visual output. There is no room for interpretation on the directives; they must all be present and correctly implemented in the final image. Failure to adhere to any directive is not an option.`;

    try {
      const { media, candidates } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: basePrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (media?.url) {
        return { imageUrls: [media.url] };
      }

      const candidate = candidates?.[0];
      let reason = "The AI did not return an image.";
      if (candidate) {
        reason += ` Finish Reason: ${candidate.finishReason}.`;
        if (candidate.finishMessage) {
          reason += ` Message: ${candidate.finishMessage}`;
        }
        if (candidate.finishReason === 'SAFETY') {
            reason += ' The prompt may have violated content safety policies.';
        }
      }
      console.error("Image generation failed. Full API response:", { media, candidates });
      throw new Error(reason);

    } catch (e: any) {
      console.error("Image generation API call failed:", e);
      throw new Error("Image generation failed. Please check the following and try again:\n1. Your GOOGLE_API_KEY is correct in your Netlify environment variables.\n2. In your Google Cloud project, the 'Generative Language API' or 'Vertex AI API' is enabled.\n3. Billing is enabled for your Google Cloud project.\n4. Your prompt does not violate content safety policies.");
    }
  }
);
