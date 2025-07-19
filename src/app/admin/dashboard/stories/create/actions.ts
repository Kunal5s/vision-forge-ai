
'use server';

import { z } from 'zod';
import { type Story, type StoryPage, getAllStoriesAdmin } from '@/lib/stories';
import { getPrimaryBranch, getShaForFile } from '@/app/admin/dashboard/create/actions'; // Reuse GitHub helpers
import { Octokit } from 'octokit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Zod schema for a single story page
const StoryPageFormSchema = z.object({
  imageUrl: z.string().url("A valid image URL is required."),
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

export async function createManualStoryAction(data: StoryFormData): Promise<{ success: boolean; error?: string; slug?: string }> {
  const validatedFields = StoryFormSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorDetails = validatedFields.error.flatten().fieldErrors;
    const formattedError = Object.entries(errorDetails)
        .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
        .join('; ');
    return { success: false, error: formattedError || 'Invalid input data.' };
  }
  
  const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
    return { success: false, error: "GitHub credentials are not configured on the server." };
  }

  try {
    const { title, slug, seoDescription, category, pages } = validatedFields.data;

    const storyPages: StoryPage[] = pages.map(page => ({
      type: 'image',
      url: page.imageUrl,
      dataAiHint: 'manual story upload', // Default hint for manually uploaded images
      content: {
        title: title, // Use the main story title for each page's title for consistency
        body: page.caption,
      },
    }));

    const newStory: Story = {
      slug,
      title,
      seoDescription,
      author: "Kunal Sonpitre", // Can be fetched from author.json in the future
      cover: storyPages[0].url, // Use the first page's image as the cover
      dataAiHint: storyPages[0].dataAiHint,
      category,
      publishedDate: new Date().toISOString(),
      status: 'published',
      pages: storyPages,
    };
    
    // For now, all stories go to the 'featured' category JSON.
    const categorySlug = 'featured'; 
    const repoPath = `src/stories/${categorySlug}.json`;
    
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
    
    let existingStories: Story[] = [];
    try {
        existingStories = await getAllStoriesAdmin(categorySlug);
    } catch (e) {
        console.log(`No existing stories found for category ${categorySlug}, creating new file.`);
    }

    const updatedStories = [newStory, ...existingStories];
    const fileContent = JSON.stringify(updatedStories, null, 2);
    const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, branch);

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: repoPath,
      message: `feat: ✨ Add new web story "${title}"`,
      content: Buffer.from(fileContent).toString('base64'),
      sha: fileSha,
      branch: branch,
    });
    
    console.log(`Successfully committed new story "${title}" to GitHub.`);

    // Revalidate paths
    revalidatePath('/admin/dashboard/stories');
    revalidatePath('/stories');
    revalidatePath(`/stories/${slug}`);

  } catch (error) {
    console.error("Error in createManualStoryAction:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
  
  redirect(`/stories/${validatedFields.data.slug}`);
}
