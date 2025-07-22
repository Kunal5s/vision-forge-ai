
'use server';

import { z } from 'zod';
import type { Story, StoryPage } from '@/lib/stories';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getFile, saveFile } from '@/lib/github';
import { allStoryData, getAllStoriesAdmin } from '@/lib/stories';


export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
    const allCategories = Object.keys(allStoryData);
    for (const category of allCategories) {
        const stories = await getAllStoriesAdmin(category);
        const foundStory = stories.find(story => story.slug === slug);
        if (foundStory) {
            return foundStory;
        }
    }
    return undefined;
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


async function updateStoryInDb(originalSlug: string, originalCategory: string, updatedStoryData: UpdateStoryFormData): Promise<void> {
    const { title, slug, seoDescription, category, pages, logo, websiteUrl } = updatedStoryData;

    // Construct the full story object
    const storyPages: StoryPage[] = pages.map(page => ({
        type: 'image',
        url: page.imageUrl,
        dataAiHint: page.imagePrompt || 'manual story upload',
        styleName: page.styleName || 'Classic Black',
        content: { title: page.caption },
    }));

    const updatedStory: Story = {
      slug,
      title,
      seoDescription,
      author: "Kunal Sonpitre", // Or fetch dynamically
      cover: storyPages[0].url,
      dataAiHint: storyPages[0].dataAiHint,
      category,
      logo: logo || undefined,
      publishedDate: new Date().toISOString(), // Or keep original
      status: 'published', // Or manage status
      pages: storyPages,
      websiteUrl: websiteUrl || undefined,
    };
    
    // If slug or category changed, we need to remove it from the old file
    if (originalSlug !== slug || originalCategory !== category) {
        const oldFilePath = `src/stories/${originalCategory.toLowerCase()}.json`;
        const oldFileContent = await getFile(oldFilePath);
        if (oldFileContent) {
            let oldStories: Story[] = JSON.parse(oldFileContent);
            const filteredStories = oldStories.filter(s => s.slug !== originalSlug);
            await saveFile(oldFilePath, JSON.stringify(filteredStories, null, 2), `refactor: remove story "${originalSlug}" from ${originalCategory}`);
        }
    }
    
    // Now save the updated story to the new/correct file
    const newFilePath = `src/stories/${category.toLowerCase()}.json`;
    const newFileContent = await getFile(newFilePath);
    let newStories: Story[] = newFileContent ? JSON.parse(newFileContent) : [];

    const existingIndex = newStories.findIndex(s => s.slug === slug);
    if (existingIndex > -1) {
        newStories[existingIndex] = updatedStory; // Update existing
    } else {
        newStories.unshift(updatedStory); // Add as new
    }
    
    await saveFile(newFilePath, JSON.stringify(newStories, null, 2), `docs: update story "${title}"`);
}


export async function updateStoryAction(data: UpdateStoryFormData): Promise<{ success: boolean; error?: string }> {
  const validatedFields = UpdateStoryFormSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: JSON.stringify(validatedFields.error.flatten()) };
  }

  const { originalSlug } = validatedFields.data;
  
  try {
    const originalStory = await getStoryBySlug(originalSlug);
    if (!originalStory) {
      throw new Error("Original story not found.");
    }

    await updateStoryInDb(originalSlug, originalStory.category, validatedFields.data);

    revalidatePath('/admin/dashboard/stories');
    revalidatePath('/stories');
    revalidatePath(`/stories/${validatedFields.data.slug}`);
    if (validatedFields.data.slug !== originalSlug) {
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
    
    try {
        const filePath = `src/stories/${category.toLowerCase()}.json`;
        const fileContent = await getFile(filePath);
        if (!fileContent) {
            throw new Error(`Story file not found for category: ${category}`);
        }

        let stories: Story[] = JSON.parse(fileContent);
        const updatedStories = stories.filter(s => s.slug !== slug);
        
        await saveFile(filePath, JSON.stringify(updatedStories, null, 2), `docs: delete story "${slug}"`);
        
        revalidatePath('/admin/dashboard/stories');
        revalidatePath('/stories');
        revalidatePath(`/stories/${slug}`);

    } catch (e: any) {
        return { success: false, error: e.message };
    }
    redirect('/admin/dashboard/stories');
}
