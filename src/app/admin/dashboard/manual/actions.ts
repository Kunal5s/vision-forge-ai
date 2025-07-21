
'use server';

import { redirect } from 'next/navigation';
import { ManualArticleSchema } from '@/lib/types';
import { saveArticle, addImagesToArticleAction as addImagesToArticleContent, autoSaveArticleDraftAction as autoSaveDraftToRepo } from '@/app/admin/dashboard/edit/[category]/[slug]/actions';

// This action creates the article and then redirects
export async function createManualArticleAction(data: unknown) {
    const validatedFields = ManualArticleSchema.safeParse(data);
    if (!validatedFields.success) {
      throw new Error('Invalid data.');
    }
    
    const { slug, category } = validatedFields.data;
  
    try {
        await saveArticle(data, true);
        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        redirect(`/admin/dashboard/edit/${categorySlug}/${slug}`);
    } catch (e: any) {
        throw new Error(e.message || "An unknown error occurred while saving the article.");
    }
}

// These actions just pass through to the server lib
export async function addImagesToArticleAction(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
    return addImagesToArticleContent(content, imageCount);
}

export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string }> {
    return autoSaveDraftToRepo(data);
}
