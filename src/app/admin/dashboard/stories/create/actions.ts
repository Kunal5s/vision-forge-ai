
'use server';

import { z } from 'zod';
import { type Story, type StoryPage, getAllStoriesAdmin, saveUpdatedStories } from '@/lib/stories';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';

// Zod schema for a single story page
// The imageUrl will now be a Base64 encoded string
const StoryPageFormSchema = z.object({
  imageUrl: z.string().min(1, "An image is required for each page."),
  caption: z.string().min(1, "Caption cannot be empty.").max(150, "Caption is too long."),
});

// Zod schema for the entire story form
const StoryFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes.'),
  seoDescription: z.string().min(10, "SEO Description is required.").max(160, "Description is too long."),
  category: z.string().min(1, "Please select a category."),
  pages: z.array(StoryPageFormSchema).min(5, "A story must have at least 5 pages."),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

// This server action now handles Base64 encoded images
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

  const { title, slug, seoDescription, category, pages } = validatedFields.data;
  
  try {
    const storyPages: StoryPage[] = pages.map(page => ({
      type: 'image',
      url: page.imageUrl, // This is now the Base64 data URI
      dataAiHint: 'manual story upload',
      content: {
        title: title, 
        body: page.caption,
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
    };
    
    // For now, all stories go to the 'featured' category JSON.
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
