
'use server';

import { z } from 'zod';
import type { Story, StoryPage } from '@/lib/stories';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// TODO: Replace with Xata fetch
export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
    console.warn("getStoryBySlug is using mock data. Needs Xata integration.");
    // This will require fetching all stories and filtering, which is inefficient.
    // A proper DB query would be `xata.db.stories.filter({ slug }).getFirst()`.
    return undefined; // Returning undefined to avoid build errors. The page will need to handle this.
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

// TODO: Replace with Xata update/delete operations
async function updateStoryInDb(originalSlug: string, updatedStory: Story): Promise<void> {
    console.log("Simulating update in Xata:", originalSlug, "->", updatedStory.title);
}

async function deleteStoryFromDb(slug: string): Promise<void> {
    console.log("Simulating deletion from Xata:", slug);
}

export async function updateStoryAction(data: UpdateStoryFormData): Promise<{ success: boolean; error?: string }> {
  const validatedFields = UpdateStoryFormSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: JSON.stringify(validatedFields.error.flatten()) };
  }

  const { title, slug, originalSlug, category, pages, logo, websiteUrl, seoDescription } = validatedFields.data;
  
  try {
    // This is a simplified version. A real implementation would fetch the existing record first.
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
      // You would need the original story's ID to update it
      // For this example, we reconstruct it
      title,
      slug,
      seoDescription,
      category,
      pages: storyPages,
      logo: logo || undefined,
      websiteUrl: websiteUrl || undefined,
      cover: storyPages[0].url,
      dataAiHint: storyPages[0].dataAiHint,
      publishedDate: new Date().toISOString(),
      author: 'Kunal Sonpitre', // Default value
      status: 'published', // Default value
    };

    await updateStoryInDb(originalSlug, updatedStory);

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
    const { slug } = validatedFields.data;
    
    try {
        await deleteStoryFromDb(slug);

        revalidatePath('/admin/dashboard/stories');
        revalidatePath(`/stories/${slug}`);

    } catch (e: any) {
        return { success: false, error: e.message };
    }
    redirect('/admin/dashboard/stories');
}
