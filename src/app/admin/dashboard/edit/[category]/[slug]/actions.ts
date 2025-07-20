
'use server';

import { z } from 'zod';
import { type Article, ArticleSchema } from '@/lib/types';
import { getAllArticlesAdmin, getPrimaryBranch, getShaForFile, saveUpdatedArticles } from '@/lib/articles'; // Reuse helper functions
import { revalidatePath } from 'next/cache';
import { addImagesToArticleAction as serverAddImages } from '../../../manual/actions';
import { Octokit } from 'octokit';
import { categorySlugMap } from '@/lib/constants';


export async function autoSaveArticleDraft(draftData: Article): Promise<{ success: boolean; error?: string }> {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        return { success: false, error: "GitHub credentials not configured on the server." };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const primaryBranch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
    const draftBranch = 'autosave-drafts';
    
    // Ensure the branch exists, creating it from the primary branch if it doesn't
    try {
        await octokit.rest.repos.getBranch({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            branch: draftBranch,
        });
    } catch (error: any) {
        if (error.status === 404) {
            const { data: { object: { sha } } } = await octokit.rest.repos.getBranch({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                branch: primaryBranch,
            });
            await octokit.rest.git.createRef({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                ref: `refs/heads/${draftBranch}`,
                sha,
            });
        } else {
            throw error;
        }
    }

    try {
        const validatedDraft = ArticleSchema.safeParse({ ...draftData, status: 'draft' });
        if (!validatedDraft.success) {
            console.error("Validation failed on auto-save:", validatedDraft.error.flatten());
            return { success: false, error: 'Invalid draft data for auto-saving.' };
        }

        const repoPath = `src/articles/drafts/${validatedDraft.data.slug}.json`;
        const fileContent = JSON.stringify(validatedDraft.data, null, 2);
        
        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, draftBranch);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: `docs: 📝 Autosave draft for "${validatedDraft.data.title}"`,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: draftBranch,
        });
        
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

// Fetches an article for editing, checking drafts in the dedicated branch first
export async function getArticleForEdit(categorySlug: string, articleSlug: string): Promise<Article | undefined> {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.warn("GitHub credentials not configured. Falling back to local file system for drafts.");
        const drafts = await getAllArticlesAdmin('drafts');
        const draft = drafts.find(d => d.slug === articleSlug);
        if (draft) return draft;
    } else {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const draftBranch = 'autosave-drafts';
        const repoPath = `src/articles/drafts/${articleSlug}.json`;

        // 1. Try to fetch from the autosave-drafts branch
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                path: repoPath,
                ref: draftBranch,
            });

            if ('content' in data) {
                const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
                return ArticleSchema.parse(JSON.parse(fileContent));
            }
        } catch (error: any) {
            if (error.status !== 404) {
                console.error(`Failed to fetch draft from GitHub branch "${draftBranch}":`, error);
            }
        }
    }
    

    // 2. If not in drafts branch or github is not configured, check the published category
    const categoryName = Object.entries(categorySlugMap).find(([slug]) => slug === categorySlug)?.[1] || categorySlug;
    const articles = await getAllArticlesAdmin(categoryName);
    const publishedArticle = articles.find(a => a.slug === articleSlug);
    if(publishedArticle) return publishedArticle;

    // 3. Lastly, check the local drafts file as a final fallback
    const localDrafts = await getAllArticlesAdmin('drafts');
    return localDrafts.find(a => a.slug === articleSlug);
}
