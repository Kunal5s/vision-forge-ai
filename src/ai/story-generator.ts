
'use server';

import { z } from 'zod';
import OpenAI from 'openai';
import type { Story, StoryPage } from '@/lib/stories';
import { saveNewStory } from '@/app/admin/dashboard/stories/create/actions';
import { revalidatePath } from 'next/cache';

// Schema for the input when generating a story
const StoryGenerationInputSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters long."),
  pageCount: z.number().min(5, "Story must have at least 5 pages.").max(20, "Story cannot have more than 20 pages."),
  category: z.string().min(1, "Please select a category."),
  openRouterApiKey: z.string().optional(),
});

export type StoryGenerationInput = z.infer<typeof StoryGenerationInputSchema>;

// Schema for the output from the AI's first step (generating scenes)
const StoryScenesOutputSchema = z.object({
  title: z.string().describe("A compelling, short title for the overall web story (around 9 words for SEO)."),
  slug: z.string().describe("A URL-friendly slug for the story title."),
  seoDescription: z.string().max(160).describe("A concise, SEO-friendly meta description for the story (max 160 characters)."),
  scenes: z.array(z.object({
    image_prompt: z.string().describe("A detailed, vibrant prompt for an image generation AI (Pollinations.ai) to create a vertical (9:16) image for this scene. The prompt should be descriptive and artistic."),
    caption: z.string().max(150).describe("A short, engaging caption for this scene (max 150 characters)."),
  })).describe("An array of scenes that tell a coherent story based on the topic.")
});

async function generateStoryScenes(input: StoryGenerationInput): Promise<z.infer<typeof StoryScenesOutputSchema>> {
  const finalApiKey = input.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  if (!finalApiKey) {
    throw new Error("OpenRouter API key is not configured. Please provide one in the UI or set the OPENROUTER_API_KEY environment variable on the server.");
  }

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: finalApiKey,
    defaultHeaders: {
        "HTTP-Referer": "https://imagenbrain.ai",
        "X-Title": "Imagen BrainAi",
    }
  });

  const response = await client.chat.completions.create({
    model: "google/gemma-2-9b-it",
    messages: [
      {
        role: "system",
        content: `You are a brilliant storyteller and visual director specialized in creating SEO-optimized web stories. Your task is to take a topic and break it down into exactly ${input.pageCount} sequential scenes. For each scene, generate a descriptive image prompt for Pollinations.ai (for a 9:16 vertical image) and a short, catchy caption (max 150 characters).

        **CRITICAL SEO INSTRUCTIONS:**
        - The overall story **title** must be compelling and around 9 words long.
        - The **seoDescription** must be a concise meta description, under 160 characters, summarizing the story's hook for search engines.
        - The slug must be URL-friendly.
        
        The scenes must tell a coherent, linear story. Respond with a valid JSON object.`,
      },
      { role: "user", content: `Topic: "${input.topic}"` },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("AI failed to generate story scenes.");
  }
  
  const parsed = JSON.parse(content);
  const validated = StoryScenesOutputSchema.safeParse(parsed);

  if (!validated.success) {
      console.error("Zod validation failed for story scenes:", validated.error.flatten());
      throw new Error("AI returned scenes in an invalid format.");
  }
  
  return validated.data;
}

function generatePollinationsImage(prompt: string): string {
    const seed = Math.floor(Math.random() * 1_000_000);
    const finalPrompt = `${prompt}, 9:16 aspect ratio, cinematic, high detail`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1080&height=1920&seed=${seed}&nologo=true`;
}

export async function generateAndSaveWebStory(input: StoryGenerationInput): Promise<{ success: boolean; error?: string; slug?: string }> {
  try {
    console.log(`Generating ${input.pageCount} scenes for topic: ${input.topic}`);
    const scenesData = await generateStoryScenes(input);

    console.log("Generating images for each scene...");
    const pages: StoryPage[] = scenesData.scenes.map(scene => ({
      type: 'image',
      url: generatePollinationsImage(scene.image_prompt),
      dataAiHint: scene.image_prompt.split(' ').slice(0, 2).join(' '),
      content: {
        title: scenesData.title, 
        body: scene.caption,
      },
    }));

    const newStory: Story = {
      slug: scenesData.slug,
      title: scenesData.title,
      seoDescription: scenesData.seoDescription,
      author: "Kunal Sonpitre", // Hardcoded for now
      cover: pages[0].url, 
      dataAiHint: pages[0].dataAiHint,
      category: input.category,
      publishedDate: new Date().toISOString(),
      status: 'published',
      pages: pages,
    };

    console.log(`Saving new story: "${newStory.title}"`);
    await saveNewStory(newStory);

    // Revalidate relevant paths
    revalidatePath('/admin/dashboard/stories');
    revalidatePath('/stories');
    revalidatePath(`/stories/${newStory.slug}`);

    return { success: true, slug: newStory.slug };

  } catch (error) {
    console.error("Error in generateAndSaveWebStory:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during story generation." };
  }
}
