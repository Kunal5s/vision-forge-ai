
'use server';

import { redirect } from 'next/navigation';
import { ManualArticleSchema } from '@/lib/types';
import { addImagesToArticleAction as addImagesToArticleContent, autoSaveArticleDraftAction as autoSaveDraftToRepo } from '@/app/admin/dashboard/edit/[category]/[slug]/actions';
import { type Article } from '@/lib/articles';
import { JSDOM } from 'jsdom';

// TODO: Replace with Xata create operation
async function saveArticle(data: any, isNew: boolean): Promise<void> {
    console.log("Simulating save to Xata:", data.title, "New:", isNew);
}

// This action creates the article and then redirects
export async function createManualArticleAction(data: unknown) {
    const validatedFields = ManualArticleSchema.safeParse(data);
    if (!validatedFields.success) {
      throw new Error('Invalid data.');
    }
    
    const { slug, category } = validatedFields.data;
  
    try {
        // This is where you would call your database function
        await saveArticle(validatedFields.data, true);

        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        redirect(`/admin/dashboard/edit/${categorySlug}/${slug}`);
    } catch (e: any) {
        throw new Error(e.message || "An unknown error occurred while saving the article.");
    }
}

// These actions just pass through to the main edit actions file
export async function addImagesToArticleAction(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
    return addImagesToArticleContent(content, imageCount);
}

export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string }> {
    return autoSaveDraftToRepo(data);
}
