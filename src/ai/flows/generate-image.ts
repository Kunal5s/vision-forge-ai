
'use server';

/**
 * @fileOverview Image generation flow using Google's latest image generation model.
 * Now generates 4 images in parallel with enhanced prompting for quality and aspect ratio.
 * - generateImage - A function that generates 4 images based on a prompt and selected styles.
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
    const basePrompt = `You are a world-class expert image generation AI, renowned for creating breathtaking and flawless visuals. Your task is to generate an image based on the following specifications.

**Primary Goal:** Generate an image that strictly adheres to the requested aspect ratio hint included in the User Prompt (e.g., 'widescreen', 'portrait'). The final image's dimensions must match this ratio as closely as possible. This is a critical requirement.

**Quality Goal:** Create a masterpiece of the highest possible quality. The image must be hyper-realistic, tack-sharp, and filled with intricate details. Aim for a 4K ultra-detailed look with cinematic lighting and professional photography standards. This quality goal should be overridden only if a non-photorealistic style (like 'Cartoon' or '8-bit') is explicitly requested.

**User Prompt:** "${input.prompt}"

${input.style ? `**Style:** ${input.style}` : ''}
${input.mood ? `**Mood:** ${input.mood}` : ''}
${input.lighting ? `**Lighting:** ${input.lighting}` : ''}
${input.color ? `**Color:** ${input.color}` : ''}

**Final Instruction:** Synthesize all the above requirements—User Prompt, aspect ratio, style, mood, lighting, color, and the highest quality standards—into a single, cohesive, and stunning visual output. Prioritize quality and aspect ratio adherence above all else.`;

    const imagePromises = Array(4).fill(null).map((_, index) =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `${basePrompt}\n\n(Variation ${index + 1} of 4, ensure uniqueness)`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const results = await Promise.allSettled(imagePromises);
    
    const successfulUrls: string[] = [];
    const detailedFailures: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.media?.url) {
        successfulUrls.push(result.value.media.url);
      } else {
        let reason = `Attempt ${index + 1} failed.`;
        if (result.status === 'rejected') {
          reason += ` Error: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`;
        } else if (result.status === 'fulfilled') {
          const candidate = result.value.candidates && result.value.candidates[0];
          if (candidate) {
            reason += ` Reason: ${candidate.finishReason} (${candidate.finishMessage || 'No specific message provided'}).`;
            if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
              reason += ' (Prompt might have violated content policies).';
            }
          } else {
            reason += ' (No media URL or candidates returned).';
          }
        }
        detailedFailures.push(reason);
      }
    });

    if (successfulUrls.length === 0) {
      let failureSummary = detailedFailures.join('\n');
      if (!failureSummary) {
          failureSummary = "All generation attempts failed without returning specific reasons. This could be due to an invalid API key, disabled Google Cloud APIs (Generative Language API or Vertex AI API), or billing issues. Please check your project configuration and server logs.";
      }
      
      const detailedErrorMessage = `Failed to generate any image URLs.\n\nFailures:\n${failureSummary}\n\nPlease verify the following and try again:\n1. Your prompt is clear and adheres to content policies.\n2. Your API key (\`GOOGLE_API_KEY\` in .env) is correct, active, and has the necessary permissions.\n3. The correct APIs are enabled in your Google Cloud project.\n4. Billing is enabled and active for your Google Cloud project.\nReview server logs for more detailed technical information on the failed attempts.`;
      
      console.error("Image generation failure details:", detailedErrorMessage, "Full API results:", JSON.stringify(results, null, 2));
      throw new Error(detailedErrorMessage);
    }
    
    if(detailedFailures.length > 0) {
        console.warn(`Image generation had partial failures:\n${detailedFailures.join('\n')}`);
    }

    return { imageUrls: successfulUrls };
  }
);
