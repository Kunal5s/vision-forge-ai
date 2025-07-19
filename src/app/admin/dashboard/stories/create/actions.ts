

'use server';

import { z } from 'zod';
import { type Story, type StoryPage, getAllStoriesAdmin, saveUpdatedStories } from '@/lib/stories';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateStoryScenes } from '@/ai/story-generator';


// Zod schema for the AI generation part
const StoryGenerationSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  imageCount: z.number().min(20).max(50),
});

interface Scene {
  image_prompt: string;
  caption: string;
}

// Zod schema for a single story page from the client
const StoryPageClientSchema = z.object({
  imageUrl: z.string().min(1, "An image is required for each page."),
  caption: z.string().min(1, "Caption cannot be empty.").max(250, "Caption is too long."),
  imagePrompt: z.string().optional(),
});

// Zod schema for the final story form submission
const StoryFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes.'),
  seoDescription: z.string().min(10, "SEO Description is required.").max(160, "Description is too long."),
  category: z.string().min(1, "Please select a category."),
  websiteUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  pages: z.array(StoryPageClientSchema).min(5, "A story must have at least 5 pages."),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;


// Server action to generate story scenes (image prompts and captions) using Genkit and Gemini
export async function generateStoryScenesAction(data: unknown): Promise<{ success: boolean; scenes?: Scene[]; error?: string }> {
  const validatedFields = StoryGenerationSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid input for scene generation." };
  }
  
  const { topic, description, imageCount } = validatedFields.data;
  
  try {
    const scenes = await generateStoryScenes({
      topic,
      description,
      image_count: imageCount
    });

    if (!scenes || !Array.isArray(scenes.scenes) || scenes.scenes.length === 0) {
      throw new Error("AI response did not match the expected format or was empty.");
    }
    return { success: true, scenes: scenes.scenes };

  } catch (error) {
    console.error("Error generating story scenes with Genkit/Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during scene generation.";
    // Provide a more user-friendly error for quota issues
    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
        return { success: false, error: "API quota exceeded. Please wait a moment and try again." };
    }
    return { success: false, error: errorMessage };
  }
}

// This is the server action that handles the final story publication
export async function createManualStoryAction(data: StoryFormData): Promise<{ success: boolean; error?: string; slug?: string }> {
  const validatedFields = StoryFormSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorDetails = validatedFields.error.flatten().fieldErrors;
    console.error("Validation Errors:", errorDetails);
    const formattedError = Object.entries(errorDetails)
        .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
        .join('; ');
    return { success: false, error: formattedError || 'Invalid input data.' };
  }

  const { title, slug, seoDescription, category, pages, websiteUrl } = validatedFields.data;
  
  try {
    const storyPages: StoryPage[] = pages.map(page => ({
      type: 'image',
      url: page.imageUrl,
      dataAiHint: page.imagePrompt || 'manual story upload',
      content: {
        title: page.caption, // Using caption as the main text for each slide
        body: '',
      },
    }));

    const newStory: Story = {
      slug,
      title,
      seoDescription,
      author: "Kunal Sonpitre",
      cover: storyPages[0].url,
      dataAiHint: storyPages[0].dataAiHint,
      category,
      publishedDate: new Date().toISOString(),
      status: 'published',
      pages: storyPages,
      websiteUrl: websiteUrl || undefined,
    };
    
    // All stories go to the 'featured' category JSON for simplicity
    const categorySlug = 'featured'; 
    
    const existingStories = await getAllStoriesAdmin(categorySlug).catch(() => {
        console.log(`No existing stories file for category ${categorySlug}, creating new file.`);
        return [];
    });
    
    const updatedStories = [newStory, ...existingStories];

    await saveUpdatedStories(categorySlug, updatedStories, `feat: ✨ Add new web story "${title}"`);
    
    console.log(`Successfully committed new story "${title}" to GitHub.`);

    revalidatePath('/admin/dashboard/stories');
    revalidatePath('/stories');
    revalidatePath(`/stories/${slug}`);

  } catch (error) {
    console.error("Error in createManualStoryAction:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
  
  redirect(`/stories/${validatedFields.data.slug}`);
}
