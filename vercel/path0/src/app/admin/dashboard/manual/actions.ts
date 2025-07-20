
'use server';

import { type Article } from '@/lib/types';
import { addImagesToArticleAction as serverAddImages, createManualArticleAction as serverCreateManual, autoSaveManualDraftAction as serverAutoSave } from '@/lib/articles';

// This file now acts as a clean 'use server' boundary.
// It re-exports the server actions from a central library file.
// This prevents client components from accidentally importing files
// that use server-only libraries like `jsdom`.

export async function addImagesToArticleAction(content: string, imageCount: number = 5): Promise<{success: boolean, content?: string, error?: string}> {
    return serverAddImages(content, imageCount);
}

export async function createManualArticleAction(data: unknown) {
    return serverCreateManual(data);
}

export async function autoSaveManualDraftAction(draftData: Article): Promise<{ success: boolean; error?: string }> {
    return serverAutoSave(draftData);
}
