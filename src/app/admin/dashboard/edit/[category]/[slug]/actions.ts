
'use server';

import { 
    getArticleForEdit as getArticleForEditInternal, 
    editArticleAction as editArticleInternal,
    deleteArticleAction as deleteArticleInternal,
    addImagesToArticleAction as addImagesInternal,
    autoSaveArticleDraftAction as autoSaveInternal
} from '@/lib/articles.server';
import type { Article } from '@/lib/types';

// This file acts as a clean server action boundary.
// It re-exports functions from the main library, ensuring
// that client components can safely import and call these server actions
// without bundling any other server-only code.

export async function getArticleForEdit(
  categorySlug: string,
  articleSlug: string
): Promise<Article | undefined> {
  return getArticleForEditInternal(categorySlug, articleSlug);
}

export async function editArticleAction(data: unknown) {
    return editArticleInternal(data);
}

export async function deleteArticleAction(category: string, slug: string, isDraft: boolean) {
    return deleteArticleInternal(category, slug, isDraft);
}

export async function addImagesToArticleAction(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
    return addImagesInternal(content, imageCount);
}

export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string; }> {
    return autoSaveInternal(data);
}
