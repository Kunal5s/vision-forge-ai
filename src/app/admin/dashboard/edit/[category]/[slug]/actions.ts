
'use server';
import { redirect } from 'next/navigation';
import { saveArticle, deleteArticle as deleteArticleFromRepo, addImagesToArticle as addImagesToArticleInContent, autoSaveArticleDraft as autoSaveDraftToRepo } from '@/lib/articles.server';

export async function editArticleAction(data: unknown) {
    try {
        await saveArticle(data, false);
        // Successful save, redirect handled by client
    } catch (e: any) {
        return { success: false, error: e.message };
    }
    redirect('/admin/dashboard/edit');
}

export async function deleteArticleAction(category: string, slug: string, isDraft: boolean) {
    try {
        await deleteArticleFromRepo(category, slug, isDraft);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
    redirect('/admin/dashboard/edit');
}

export async function addImagesToArticleAction(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
    return addImagesToArticleInContent(content, imageCount);
}

export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string }> {
    return autoSaveDraftToRepo(data);
}
