
'use server';

import { z } from 'zod';
import { type Article, ArticleSchema } from '@/lib/types';
import { Octokit } from 'octokit';
import { getPrimaryBranch, getShaForFile } from '@/lib/articles'; // Reuse helper functions
import { categorySlugMap } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { addImagesToArticleAction as serverAddImages } from '../../../manual/actions';


// Fetches the specific article data, including draft content if it exists
export async function getArticleForEdit(category: string, slug: string): Promise<Article | undefined> {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;

    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.warn("GitHub credentials not configured. Cannot fetch articles for edit.");
        // Fallback or error handling can be improved here
        return undefined;
    }
    
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const owner = GITHUB_REPO_OWNER;
    const repo = GITHUB_REPO_NAME;
    const draftBranch = 'autosave-drafts'; // Always check the drafts branch first

    const draftPath = `src/articles/drafts/${slug}.json`;
    let articleData: Article | undefined;

    // 1. Try fetching from the draft branch
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: draftPath,
            ref: `heads/${draftBranch}`,
        });
        if ('content' in data && data.content) {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
            articleData = JSON.parse(fileContent) as Article;
            console.log(`Loaded draft for "${slug}" from "autosave-drafts" branch.`);
            return ArticleSchema.parse(articleData);
        }
    } catch (error: any) {
        if (error.status !== 404) {
            console.error('Error fetching draft from GitHub:', error);
        } else {
            console.log(`No draft found for "${slug}" in "autosave-drafts" branch. Checking main branch.`);
        }
    }

    // 2. If no draft found, fetch from the main published branch
    const categoryName = Object.entries(categorySlugMap).find(([catSlug]) => catSlug === category)?.[1];
    if (!categoryName) return undefined;
    
    const mainBranch = await getPrimaryBranch(octokit, owner, repo);
    const articlesPath = `src/articles/${categorySlug}.json`; // Use category slug here
    
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: articlesPath,
            ref: mainBranch,
        });
        if ('content' in data && data.content) {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
            const articles: Article[] = JSON.parse(fileContent);
            articleData = articles.find(a => a.slug === slug);
        }
    } catch (error: any) {
        if (error.status !== 404) {
          console.error(`Error fetching published article from GitHub path: ${articlesPath}`, error);
        }
        return undefined;
    }
    
    if (articleData) {
      return ArticleSchema.parse(articleData);
    }
    return undefined;
}


// Server action for auto-saving a draft to a separate branch
export async function autoSaveArticleDraft(draftData: Article, category: string): Promise<{ success: boolean; error?: string }> {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        return { success: false, error: 'GitHub credentials not configured.' };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const branch = 'autosave-drafts';
    const draftPath = `src/articles/drafts/${draftData.slug}.json`;
    const fileContent = JSON.stringify(draftData, null, 2);

    try {
        const primaryBranch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        
        // Ensure the 'autosave-drafts' branch exists
        try {
            await octokit.rest.repos.getBranch({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                branch,
            });
        } catch (error: any) {
            if (error.status === 404) {
                // Branch doesn't exist, so create it from the primary branch
                const { data: { object: { sha } } } = await octokit.rest.git.getRef({
                    owner: GITHUB_REPO_OWNER,
                    repo: GITHUB_REPO_NAME,
                    ref: `heads/${primaryBranch}`,
                });
                await octokit.rest.git.createRef({
                    owner: GITHUB_REPO_OWNER,
                    repo: GITHUB_REPO_NAME,
                    ref: `refs/heads/${branch}`,
                    sha,
                });
                console.log(`Created 'autosave-drafts' branch.`);
            } else {
                throw error;
            }
        }

        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, draftPath, branch);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: draftPath,
            message: `docs: 📝 Autosave draft for "${draftData.title}"`,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: branch,
        });

        // This revalidation is important if you have a page that lists drafts
        revalidatePath('/admin/dashboard/edit');

        return { success: true };
    } catch (error: any) {
        console.error('Failed to auto-save draft to GitHub:', error);
        return { success: false, error: error.message };
    }
}


export async function addImagesToArticleAction(content: string, imageCount: number = 5): Promise<{success: boolean, content?: string, error?: string}> {
    return serverAddImages(content, imageCount);
}
