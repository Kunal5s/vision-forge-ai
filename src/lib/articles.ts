
'use server';

import fs from 'fs/promises';
import path from 'path';
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
  status: z.enum(['published', 'draft']).default('published'), // Add status field
  publishedDate: z.string().datetime(), // Make it required
  summary: z.string().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
  keyTakeaways: z.array(z.string()),
  conclusion: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

const ArticleFileSchema = z.array(ArticleSchema);

const articleCache = new Map<string, Article[]>();
const allArticlesCache = new Map<string, Article[]>();

async function loadAndValidateArticles(category: string): Promise<Article[]> {
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);

    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const articlesData = JSON.parse(fileContent);

        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            return validatedArticles.data;
        } else {
             console.warn(`Zod validation failed for ${categorySlug}.json.`, validatedArticles.error.flatten());
             return [];
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // This is not an error, just means no articles for this category yet.
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}

// For public-facing pages: gets all articles regardless of status to ensure content is always shown.
export async function getArticles(category: string): Promise<Article[]> {
    const cacheKey = `published-${category}`;
    // Always re-fetch in dev mode for immediate updates, cache in production
    if (process.env.NODE_ENV === 'production' && articleCache.has(cacheKey)) {
        return articleCache.get(cacheKey)!;
    }
    
    // This will now fetch all articles from the JSON, ignoring the 'status' field for public display.
    const allArticles = await loadAndValidateArticles(category);

    articleCache.set(cacheKey, allArticles);
    return allArticles;
}

// For admin pages: gets ALL articles, including drafts
export async function getAllArticlesAdmin(category: string): Promise<Article[]> {
    const cacheKey = `all-${category}`;
    // Always re-fetch in dev mode for immediate updates, cache in production
    if (process.env.NODE_ENV === 'production' && allArticlesCache.has(cacheKey)) {
        return allArticlesCache.get(cacheKey)!;
    }

    const allArticles = await loadAndValidateArticles(category);
    allArticlesCache.set(cacheKey, allArticles);
    return allArticles;
}
