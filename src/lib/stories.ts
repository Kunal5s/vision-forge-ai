

'use server';

import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { Octokit } from 'octokit';
import { getPrimaryBranch, getShaForFile } from '@/app/admin/dashboard/create/actions'; // Reuse GitHub helpers


// Direct imports for reliability
import featuredStories from '@/stories/featured.json';

const StoryPageContentSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});

const StoryPageSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().min(1), // Can be a standard URL or a Data URI
  dataAiHint: z.string(),
  styleName: z.string().optional(),
  content: StoryPageContentSchema.optional(),
});
export type StoryPage = z.infer<typeof StoryPageSchema>;

const StorySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  seoDescription: z.string().optional().default(''),
  logo: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  author: z.string().optional().default('Imagen BrainAi'),
  cover: z.string().min(1), // Can be a standard URL or a Data URI
  dataAiHint: z.string(),
  category: z.string(),
  publishedDate: z.string().datetime(),
  status: z.enum(['published', 'draft']).default('published'),
  pages: z.array(StoryPageSchema),
});
export type Story = z.infer<typeof StorySchema>;

const StoryFileSchema = z.array(StorySchema);

// A map to hold all imported story data
const allStoryData: { [key: string]: any } = {
    'featured': featuredStories,
};

async function loadAndValidateStories(category: string): Promise<Story[]> {
    const storyData = allStoryData[category.toLowerCase()];

    if (!storyData) {
        console.warn(`No story data found for category "${category}"`);
        return [];
    }
    
    try {
        const validatedStories = StoryFileSchema.safeParse(storyData);

        if (validatedStories.success) {
            return validatedStories.data.map(story => ({
                ...story,
                // Provide default for backward compatibility
                seoDescription: story.seoDescription || story.pages[0]?.content?.body?.substring(0, 160) || story.title,
                author: story.author || 'Imagen BrainAi'
            }));
        } else {
            console.error(`Zod validation failed for stories in category "${category}".`, validatedStories.error.flatten());
            return [];
        }

    } catch (error: any) {
        console.error(`Error validating stories for category "${category}":`, error.message);
        return [];
    }
}

// Gets only published stories
export async function getStories(category: string): Promise<Story[]> {
    const allStories = await loadAndValidateStories(category);
    // Sort by most recent first
    return allStories
        .filter(story => story.status === 'published')
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}

// Gets all stories, including drafts (for admin)
export async function getAllStoriesAdmin(category: string): Promise<Story[]> {
     const allStories = await loadAndValidateStories(category);
     return allStories.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}

// Get a single story by its slug from any category
export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
    const allCategories = Object.keys(allStoryData);
    for (const category of allCategories) {
        // Search in all stories, including drafts, to allow previewing
        const stories = await getAllStoriesAdmin(category);
        const foundStory = stories.find(story => story.slug === slug);
        if (foundStory) {
            return foundStory;
        }
    }
    return undefined;
}

// Universal function to save stories to GitHub
export async function saveUpdatedStories(categorySlug: string, stories: Story[], commitMessage: string) {
    const repoPath = `src/stories/${categorySlug}.json`;
    const fileContent = JSON.stringify(stories, null, 2);

    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.error("GitHub credentials are not configured on the server. Cannot save story.");
        throw new Error("GitHub credentials not configured. Please check server environment variables.");
    }

    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, branch);
        
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: commitMessage,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: branch,
        });
        console.log(`Successfully committed changes for stories in "${categorySlug}" to GitHub on branch "${branch}".`);
    } catch (error) {
        console.error("Failed to commit changes to GitHub.", error);
        throw new Error("Failed to save story to GitHub. Please check your credentials and repository permissions.");
    }
}
