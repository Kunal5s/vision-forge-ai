
'use server';
import { 
    editArticleAction as serverEdit, 
    deleteArticleAction as serverDelete,
    addImagesToArticleAction as serverAddImages,
    autoSaveArticleDraftAction as serverAutoSave,
} from '@/lib/articles.server';

// This file now acts as a clean 'use server' boundary.
// It re-exports the server actions from a central library file.
// This prevents client components from accidentally importing files
// that use server-only libraries.

export async function editArticleAction(data: unknown) {
    return serverEdit(data);
}

export async function deleteArticleAction(category: string, slug: string, isDraft: boolean) {
    return serverDelete(category, slug, isDraft);
}

export async function addImagesToArticleAction(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
  return serverAddImages(content, imageCount);
}

export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string }> {
  return serverAutoSave(data);
}
