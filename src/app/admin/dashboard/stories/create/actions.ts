
'use server';

import type { Story } from '@/lib/stories';
import { getAllStoriesAdmin } from '@/lib/stories';
import { Octokit } from 'octokit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateAndSaveWebStory, StoryGenerationInput } from '@/ai/story-generator';
import { z } from 'zod';

// This is the Zod schema for the form on the frontend
const StoryFormSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters long."),
  pageCount: z.string().refine(val => !isNaN(parseInt(val)), { message: "Page count must be a number." })
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 5 && val <= 20, { message: "Story must have between 5 and 20 pages." }),
  category: z.string().min(1, "Please select a category."),
});


export async function generateStoryAction(data: unknown): Promise<{ success: boolean; error?: string; slug?: string }> {
    const validatedFields = StoryFormSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("Validation Errors:", validatedFields.error.flatten());
      const firstError = validatedFields.error.flatten().fieldErrors;
      const errorMsg = Object.values(firstError)[0]?.[0] || 'Invalid input data.';
      return { success: false, error: errorMsg };
    }

    try {
        const result = await generateAndSaveWebStory(validatedFields.data);

        if (!result.success) {
            throw new Error(result.error || 'AI failed to generate the web story.');
        }

        // On success, redirect to the story management page or a success page.
        // For now, let's redirect to the main stories dashboard.
        revalidatePath('/admin/dashboard');
        redirect(`/admin/dashboard/`); // Redirect to a future edit page would be ideal

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during story generation.';
        return { success: false, error: errorMessage };
    }
}


async function getShaForFile(octokit: Octokit, owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        if (Array.isArray(data) || !('sha' in data)) {
            return undefined;
        }
        return data.sha;
    } catch (error: any) {
        if (error.status === 404) {
            return undefined;
        }
        throw error;
    }
}

async function getPrimaryBranch(octokit: Octokit, owner: string, repo: string): Promise<string> {
    if (process.env.GITHUB_BRANCH) {
        return process.env.GITHUB_BRANCH;
    }
    try {
        await octokit.rest.repos.getBranch({ owner, repo, branch: 'main' });
        return 'main';
    } catch (error: any) {
        if (error.status === 404) {
            try {
                await octokit.rest.repos.getBranch({ owner, repo, branch: 'master' });
                return 'master';
            } catch (masterError) {
                 console.error("Could not find 'main' or 'master' branch.", masterError);
                 throw new Error("Could not determine primary branch. Neither 'main' nor 'master' found.");
            }
        }
        throw error;
    }
}


export async function saveNewStory(newStory: Story) {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.error("GitHub credentials are not configured on the server. Cannot save story.");
        throw new Error("GitHub credentials not configured. Please check Vercel environment variables.");
    }
    
    const category = newStory.category.toLowerCase();
    const repoPath = `src/stories/${category}.json`;

    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        
        let existingStories: Story[] = [];
        try {
            existingStories = await getAllStoriesAdmin(category);
        } catch(e) {
            // File might not exist, which is fine.
            console.log(`No existing stories found for category ${category}, creating new file.`);
        }

        const updatedStories = [newStory, ...existingStories];
        const fileContent = JSON.stringify(updatedStories, null, 2);

        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, branch);
        
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: `feat: ✨ Add new web story "${newStory.title}"`,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: branch,
        });
        console.log(`Successfully committed new story for "${category}" to GitHub on branch "${branch}".`);
    } catch (error) {
        console.error("Failed to commit new story to GitHub.", error);
        throw new Error("Failed to save story to GitHub. Please check credentials and repository permissions.");
    }
}
