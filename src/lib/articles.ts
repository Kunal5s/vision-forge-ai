
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { categorySlugMap } from './constants';

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
  status: z.enum(['published', 'draft']).default('published'),
  publishedDate: z.string().datetime(),
  summary: z.string().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
  keyTakeaways: z.array(z.string()),
  conclusion: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

const ArticleFileSchema = z.array(ArticleSchema);

async function loadAndValidateArticles(category: string): Promise<Article[]> {
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const articlesData = JSON.parse(fileContent);
        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            return validatedArticles.data;
        } else {
            console.error(`Zod validation failed for ${categorySlug}.json.`, validatedArticles.error.flatten());
            return [];
        }

    } catch (error: any) {
        // If file not found, it's not a critical error, just means no articles for that category.
        if (error.code === 'ENOENT') {
            console.log(`No article file found for category "${category}" at ${filePath}`);
        } else {
            // For other errors (like JSON parsing), log them.
            console.error(`Error loading articles for category "${category}":`, error.message);
        }
        return [];
    }
}

// For public-facing pages: gets ONLY published articles.
export async function getArticles(category: string): Promise<Article[]> {
    const allArticles = await loadAndValidateArticles(category);
    return allArticles.filter(article => article.status === 'published');
}

// For admin pages: gets ALL articles, including drafts
export async function getAllArticlesAdmin(category: string): Promise<Article[]> {
    const allArticles = await loadAndValidateArticles(category);
    return allArticles;
}
