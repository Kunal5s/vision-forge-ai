
'use server';

import { getArticleForEdit as getArticleForEditInternal } from '@/lib/articles.server';
import { type Article } from '@/lib/types';

// This file acts as a clean server action boundary.
// It re-exports a function from the main library, ensuring
// that client components can safely import and call this server action
// without bundling any other server-only code from `lib/articles.ts`.

export async function getArticleForEdit(
  categorySlug: string,
  articleSlug: string
): Promise<Article | undefined> {
  return getArticleForEditInternal(categorySlug, articleSlug);
}
