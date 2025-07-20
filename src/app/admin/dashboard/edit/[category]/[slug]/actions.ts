
'use server';

import { z } from 'zod';
import { type Article } from '@/lib/articles';
import { Octokit } from 'octokit';
import { getPrimaryBranch, getShaForFile } from '../../../create/actions'; // Reuse helper functions
import { categorySlugMap } from '@/lib/constants';

// Fetches the specific article data, including draft content if it exists
export async function getArticleForEdit(category: string, slug: string): Promise<Article | undefined> {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = process.env.GITHUB_REPO_OWNER!;
    const repo = process.env.GITHUB_REPO_NAME!;
    const branch = 'autosave-drafts'; // Always check the drafts branch first

    const draftPath = `src/articles/drafts/${slug}.json`;
    let articleData: Article | undefined;

    // 1. Try fetching from the draft branch
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: draftPath,
            ref: branch,
        });
        if ('content' in data) {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
            articleData = JSON.parse(fileContent) as Article;
        }
    } catch (error: any) {
        // If draft not found (404), proceed to fetch from the main branch.
        if (error.status !== 404) {
            console.error('Error fetching draft from GitHub:', error);
        }
    }

    // 2. If no draft found, fetch from the main published branch
    if (!articleData) {
        const categoryName = Object.entries(categorySlugMap).find(([catSlug]) => catSlug === category)?.[1];
        if (!categoryName) return undefined;
        
        const mainBranch = await getPrimaryBranch(octokit, owner, repo);
        const articlesPath = `src/articles/${category}.json`;
        
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: articlesPath,
                ref: mainBranch,
            });
            if ('content' in data) {
                const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
                const articles: Article[] = JSON.parse(fileContent);
                articleData = articles.find(a => a.slug === slug);
            }
        } catch (error) {
            console.error('Error fetching published article from GitHub:', error);
            return undefined;
        }
    }

    return articleData;
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

        return { success: true };
    } catch (error: any) {
        console.error('Failed to auto-save draft to GitHub:', error);
        return { success: false, error: error.message };
    }
}
