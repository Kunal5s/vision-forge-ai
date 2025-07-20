

'use server';

import { z } from 'zod';
import { type Story, type StoryPage, getAllStoriesAdmin, saveUpdatedStories, getStoryBySlug as getStoryBySlugInternal } from '@/lib/stories';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
    return getStoryBySlugInternal(slug);
}

const StoryPageClientSchema = z.object({
  imageUrl: z.string().min(1, "An image is required for each page."),
  caption: z.string().min(1, "Caption cannot be empty.").max(250, "Caption is too long."),
  imagePrompt: z.string().optional(),
  styleName: z.string().optional(),
});

const UpdateStoryFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes.'),
  originalSlug: z.string(),
  seoDescription: z.string().min(10, "SEO Description is required.").max(160, "Description is too long."),
  category: z.string().min(1, "Please select a category."),
  logo: z.string().optional(),
  websiteUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  pages: z.array(StoryPageClientSchema).min(5, "A story must have at least 5 pages."),
});

type UpdateStoryFormData = z.infer<typeof UpdateStoryFormSchema>;

export async function updateStoryAction(data: UpdateStoryFormData): Promise<{ success: boolean; error?: string }> {
  const validatedFields = UpdateStoryFormSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: JSON.stringify(validatedFields.error.flatten()) };
  }

  const { title, slug, originalSlug, category, pages, logo, websiteUrl, seoDescription } = validatedFields.data;
  
  // All stories are currently in the 'featured' category file
  const categorySlug = 'featured';

  try {
    let stories = await getAllStoriesAdmin(categorySlug);
    const storyIndex = stories.findIndex(s => s.slug === originalSlug);

    if (storyIndex === -1) {
      throw new Error("Original story not found.");
    }

    const existingStory = stories[storyIndex];

    const storyPages: StoryPage[] = pages.map(page => ({
      type: 'image',
      url: page.imageUrl,
      dataAiHint: page.imagePrompt || 'manual story upload',
      styleName: page.styleName || 'Classic Black',
      content: {
        title: page.caption,
      },
    }));

    const updatedStory: Story = {
      ...existingStory,
      title,
      slug,
      seoDescription,
      category,
      logo: logo || undefined,
      websiteUrl: websiteUrl || undefined,
      cover: storyPages[0].url,
      dataAiHint: storyPages[0].dataAiHint,
      pages: storyPages,
      publishedDate: new Date().toISOString(), // Update date on every edit
    };

    stories[storyIndex] = updatedStory;

    await saveUpdatedStories(categorySlug, stories, `feat: ✏️ Edit web story "${title}"`);

    revalidatePath('/admin/dashboard/stories');
    revalidatePath(`/stories/${slug}`);
    if (slug !== originalSlug) {
      revalidatePath(`/stories/${originalSlug}`);
    }

    return { success: true };

  } catch (error) {
    console.error("Error in updateStoryAction:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}

const DeleteStorySchema = z.object({
  slug: z.string(),
  category: z.string(),
});

export async function deleteStoryAction(data: unknown): Promise<{ success: boolean; error?: string }> {
    const validatedFields = DeleteStorySchema.safeParse(data);
    if (!validatedFields.success) {
        return { success: false, error: 'Invalid data for deletion.' };
    }
    const { slug, category } = validatedFields.data;
    
    // For now, all stories are in 'featured'
    const categorySlug = 'featured';

    try {
        let stories = await getAllStoriesAdmin(categorySlug);
        const updatedStories = stories.filter(s => s.slug !== slug);

        if (stories.length === updatedStories.length) {
            throw new Error("Story to delete was not found.");
        }

        await saveUpdatedStories(categorySlug, updatedStories, `feat: 🗑️ Delete web story "${slug}"`);

        revalidatePath('/admin/dashboard/stories');
        revalidatePath(`/stories/${slug}`);

    } catch (e: any) {
        return { success: false, error: e.message };
    }
    redirect('/admin/dashboard/stories');
}
