
'use server';
import { 
    editArticleAction as serverEdit, 
    deleteArticleAction as serverDelete 
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
