
'use server';

import fs from 'fs/promises';
import path from 'path';
import { Octokit } from 'octokit';
import { z } from 'zod';

const ArticleContentBlockSchema = z.object({
  type: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img']),
  content: z.string(),
  alt: z.string().optional(),
});
export type ArticleContentBlock = z.infer<typeof ArticleContentBlockSchema>;

const ArticleSchema = z.object({
  image: z.string().url(),
  dataAiHint: z.string(),
  category: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  publishedDate: z.string().datetime().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
  keyTakeaways: z.array(z.string()),
  conclusion: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

const ArticleFileSchema = z.array(ArticleSchema);

const articleCache = new Map<string, Article[]>();

// This function now primarily reads from local files for the build process,
// but the saving logic is handled directly via GitHub commits in the server actions.
export async function getArticles(category: string): Promise<Article[]> {
    const cacheKey = category;
    if (articleCache.has(cacheKey)) {
        return articleCache.get(cacheKey)!;
    }

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);

    try {
        // In a Vercel deployment, the file system is read-only.
        // We first check if the file exists before trying to read it.
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const articlesData = JSON.parse(fileContent);

        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            articleCache.set(cacheKey, validatedArticles.data);
            return validatedArticles.data;
        } else {
             console.warn(`Zod validation failed for ${categorySlug}.json.`, validatedArticles.error.flatten());
             return [];
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log(`No local articles file found for "${category}". This is expected if the category is new. An empty array will be used.`);
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}

// Deprecated function stubs - logic moved to server actions
export async function generateAndSaveArticles(category: string, topics: string[]) {
    console.warn("generateAndSaveArticles is deprecated. Use generateArticleAction in the admin panel.");
    return;
}
