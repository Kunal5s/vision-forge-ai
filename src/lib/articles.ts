
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
  status: z.enum(['published', 'draft']).default('published'), // Add status field with default
  publishedDate: z.string().datetime(), // Make it required
  summary: z.string().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
  keyTakeaways: z.array(z.string()),
  conclusion: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

const ArticleFileSchema = z.array(ArticleSchema);

// This function now correctly uses the Zod schema's default 'published' status.
async function loadAndValidateArticles(category: string): Promise<Article[]> {
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const repoPath = `src/articles/${categorySlug}.json`;
    const GITHUB_REPO_URL = `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/${repoPath}`;
    
    // Add a cache-busting parameter to the URL
    const urlWithCacheBust = `${GITHUB_REPO_URL}?${new Date().getTime()}`;

    try {
        const { GITHUB_TOKEN } = process.env;
        if (!GITHUB_TOKEN) {
            throw new Error("GitHub token is not configured on the server.");
        }
        
        const response = await fetch(urlWithCacheBust, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3.raw',
            },
            // Force re-fetch, disable caching
            cache: 'no-store',
        });

        if (!response.ok) {
            if (response.status === 404) {
                 console.warn(`Article file not found for category "${category}" on GitHub.`);
                 return [];
            }
            throw new Error(`Failed to fetch from GitHub: ${response.statusText}`);
        }

        const articlesData = await response.json();
        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            return validatedArticles.data;
        } else {
            console.error(`Zod validation failed for ${categorySlug}.json from GitHub.`, validatedArticles.error.flatten());
            return [];
        }

    } catch (error: any) {
        console.error(`Error loading articles for category "${category}" from GitHub:`, error.message);
        return [];
    }
}

// For public-facing pages: gets ONLY published articles.
export async function getArticles(category: string): Promise<Article[]> {
    const allArticles = await loadAndValidateArticles(category);
    // Filter for published articles AFTER loading them
    const publishedArticles = allArticles.filter(article => article.status === 'published');
    return publishedArticles;
}

// For admin pages: gets ALL articles, including drafts
export async function getAllArticlesAdmin(category: string): Promise<Article[]> {
    // This function will return all articles, regardless of status.
    const allArticles = await loadAndValidateArticles(category);
    return allArticles;
}
