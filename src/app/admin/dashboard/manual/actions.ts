
'use server';

import { redirect } from 'next/navigation';
import { ManualArticleSchema, type Article, articleContentToHtml } from '@/lib/types';
import { addImagesToArticleAction as addImagesToArticleContent, autoSaveArticleDraftAction as autoSaveDraftToRepo } from '@/app/admin/dashboard/edit/[category]/[slug]/actions';
import { getFile, saveFile } from '@/lib/github';
import { revalidatePath } from 'next/cache';
import { categorySlugMap } from '@/lib/constants';


// This action creates the article and then redirects
export async function createManualArticleAction(data: unknown) {
    const validatedFields = ManualArticleSchema.safeParse(data);
    if (!validatedFields.success) {
      throw new Error('Invalid data: ' + JSON.stringify(validatedFields.error.flatten()));
    }
    
    const { title, slug, category, status, summary, content, image } = validatedFields.data;
  
    try {
        const article: Article = {
            title: `<strong>${title}</strong>`,
            slug,
            category,
            status,
            summary: summary || '',
            image,
            dataAiHint: 'manual-creation',
            articleContent: articleContentToHtml({ type: 'p', content: content }),
            publishedDate: new Date().toISOString(),
        };
        
        const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === article.category) || article.category.toLowerCase();
        const filePath = status === 'draft' ? `src/articles/drafts.json` : `src/articles/${categorySlug}.json`;
        
        let existingArticles: Article[] = [];
        const currentContent = await getFile(filePath);
        if (currentContent) {
            existingArticles = JSON.parse(currentContent);
        }

        existingArticles.unshift(article);
        
        await saveFile(filePath, JSON.stringify(existingArticles, null, 2), `feat: add new manual article "${title}"`);

        revalidatePath('/admin/dashboard/edit');
        revalidatePath(`/${categorySlug}`);
        revalidatePath(`/blog`);

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
