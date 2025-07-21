
'use server';

import { redirect } from 'next/navigation';
import { createManualArticleAction as createManualArticleInRepo, addImagesToArticle as addImagesToArticleInContent, autoSaveArticleDraft as autoSaveDraftToRepo } from '@/lib/articles.server';

// This action creates the article and then redirects
export async function createManualArticleAction(data: unknown) {
    try {
        const { slug, category } = await createManualArticleInRepo(data);
        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        redirect(`/admin/dashboard/edit/${categorySlug}/${slug}`);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// These actions just pass through to the server lib
export async function addImagesToArticleAction(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
    return addImagesToArticleInContent(content, imageCount);
}

export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string }> {
    return autoSaveDraftToRepo(data);
}
