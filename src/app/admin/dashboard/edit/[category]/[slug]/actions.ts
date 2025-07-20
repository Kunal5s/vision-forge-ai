
'use server';

import { z } from 'zod';
import { type Article, ArticleSchema } from '@/lib/types';
import { Octokit } from 'octokit';
import { getAllArticlesAdmin, getPrimaryBranch, getShaForFile, saveUpdatedArticles } from '@/lib/articles'; // Reuse helper functions
import { categorySlugMap } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { addImagesToArticleAction as serverAddImages } from '../../../manual/actions';


export async function autoSaveArticleDraft(draftData: Article): Promise<{ success: boolean; error?: string }> {
    try {
        const validatedDraft = ArticleSchema.safeParse({ ...draftData, status: 'draft' });
        if (!validatedDraft.success) {
            console.error("Validation failed on auto-save:", validatedDraft.error.flatten());
            return { success: false, error: 'Invalid draft data for auto-saving.' };
        }

        const allDrafts = await getAllArticlesAdmin('drafts');
        const draftIndex = allDrafts.findIndex(d => d.slug === validatedDraft.data.slug);

        if (draftIndex > -1) {
            allDrafts[draftIndex] = validatedDraft.data;
        } else {
            allDrafts.unshift(validatedDraft.data);
        }

        await saveUpdatedArticles('drafts', allDrafts, `docs: 📝 Autosave draft for "${validatedDraft.data.title}"`, 'drafts.json');

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
