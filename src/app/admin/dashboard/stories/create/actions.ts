

'use server';

import { z } from 'zod';
import { type Story, type StoryPage, getAllStoriesAdmin, saveUpdatedStories } from '@/lib/stories';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Zod schema for the image generation part (simplified)
const ImageGenerationSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters long."),
  imageCount: z.number().min(5).max(50),
});

// Zod schema for a single story page from the client
const StoryPageClientSchema = z.object({
  imageUrl: z.string().min(1, "An image is required for each page."),
  caption: z.string().min(1, "Caption cannot be empty.").max(250, "Caption is too long."),
  imagePrompt: z.string().optional(), // The original prompt used for generation
});

// Zod schema for the final story form submission
const StoryFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes.'),
  seoDescription: z.string().min(10, "SEO Description is required.").max(160, "Description is too long."),
  category: z.string().min(1, "Please select a category."),
  logo: z.string().optional(),
  websiteUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  pages: z.array(StoryPageClientSchema).min(5, "A story must have at least 5 pages."),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

// Server action to generate only the images using Pollinations.ai
export async function generateStoryImagesAction(data: unknown): Promise<{ success: boolean; images?: { imageUrl: string, imagePrompt: string }[]; error?: string }> {
  const validatedFields = ImageGenerationSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid input for image generation." };
  }
  
  const { prompt, imageCount } = validatedFields.data;
  
  try {
    const imagePromises = Array.from({ length: imageCount }).map(async (_, index): Promise<{ imageUrl: string, imagePrompt: string } | null> => {
        try {
            // Add specific instructions to avoid text and get the right aspect ratio.
            const finalPrompt = `${prompt}, 9:16 aspect ratio, vertical, cinematic, watermark-free, no text, no signatures`;
            const seed = Math.floor(Math.random() * 1_000_000_000);
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1080&height=1920&seed=${seed}&nologo=true`;

            // Directly return the URL and the original user prompt
            return {
                imageUrl: pollinationsUrl,
                imagePrompt: prompt, // Save the original user prompt for context
            };
        } catch (e) {
            console.error(`Error generating image ${index + 1}:`, e);
            return null; // Return null for failed images
        }
    });

    const generatedImages = (await Promise.all(imagePromises)).filter(img => img !== null) as { imageUrl: string, imagePrompt: string }[];

    if (generatedImages.length === 0) {
        throw new Error("The image generation service failed to create any images. Please try again.");
    }

    return { success: true, images: generatedImages };

  } catch (error) {
    console.error("Error generating story images with Pollinations.ai:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
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

  const { title, slug, seoDescription, category, pages, logo, websiteUrl } = validatedFields.data;
  
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
      logo: logo || undefined,
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
  
  // Redirect to the management page instead of the public story page
  redirect(`/admin/dashboard/stories`);
}
