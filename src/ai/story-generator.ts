/**
 * @fileoverview This file defines a Genkit flow for generating web story scenes.
 * It uses the Google Gemini 1.5 Flash model to create a series of image prompts and captions
 * based on a user-provided topic and description.
 *
 * - generateStoryScenes: The main function to call the Genkit flow.
 * - StorySceneRequest: The Zod schema for the flow's input.
 * - StorySceneResponse: The Zod schema for the flow's output.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the input schema for the story generation request
export const StorySceneRequest = z.object({
  topic: z.string().describe("The main topic or title of the web story."),
  description: z.string().describe("A brief description of the story's theme or narrative."),
  image_count: z.number().min(5).max(50).describe("The exact number of scenes to generate."),
});

// Define the schema for a single scene (image prompt + caption)
const SceneSchema = z.object({
  image_prompt: z.string().describe("A detailed, vivid, and unique prompt for an AI image generator to create a 9:16 vertical image. Should be descriptive and imaginative."),
  caption: z.string().max(250).describe("A short, engaging caption for the image, maximum 250 characters. It should complement the visual narrative."),
});

// Define the output schema for the entire response
export const StorySceneResponse = z.object({
  scenes: z.array(SceneSchema).describe("An array of generated scenes, each containing an image prompt and a caption."),
});

// Define the Genkit flow using the schemas
const storySceneFlow = ai.defineFlow(
  {
    name: 'storySceneFlow',
    inputSchema: StorySceneRequest,
    outputSchema: StorySceneResponse,
  },
  async (input) => {
    // Use the Gemini 1.5 Flash model for fast and high-quality text generation
    const llm = ai.model('google/gemini-1.5-flash');

    const prompt = `
      You are a creative visual storyteller and an expert in creating engaging web stories.
      Based on the user's topic and description, generate a JSON object containing a key "scenes".
      This key should be an array of exactly ${input.image_count} scene objects.

      Each scene object must have two keys:
      1.  "image_prompt": A detailed, vivid, and unique prompt for an AI image generator (like Pollinations.ai or DALL-E) to create a compelling 9:16 vertical image. This prompt should be highly descriptive, focusing on visual elements, mood, and composition. Do NOT include the aspect ratio in the prompt itself.
      2.  "caption": A short, engaging caption for that image, with a maximum of 250 characters. The captions should progressively tell a cohesive story.

      The entire output must be a single, valid JSON object and nothing else.

      ---
      Topic: ${input.topic}
      Description: ${input.description}
      ---
    `;

    const { output } = await llm.generate({
      prompt,
      config: {
        // Request JSON output from the model
        response: {
            format: 'json',
            schema: StorySceneResponse,
        },
        temperature: 0.8, // Increase creativity
      },
    });

    if (!output) {
      throw new Error("The AI model returned an empty response.");
    }
    
    // The output is already validated against StorySceneResponse by Genkit
    return output;
  }
);

// Exported wrapper function to be used by server actions
export async function generateStoryScenes(input: z.infer<typeof StorySceneRequest>): Promise<z.infer<typeof StorySceneResponse>> {
  return storySceneFlow(input);
}
