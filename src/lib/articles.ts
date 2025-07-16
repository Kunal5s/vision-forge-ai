
'use server';

import { z } from 'zod';
import { categorySlugMap } from './constants';

// Direct imports to ensure files are bundled during the build process.
// This is the most reliable way to access local JSON data in Next.js across all environments.
import featuredArticles from '@/articles/featured.json';
import inspirationArticles from '@/articles/inspiration.json';
import nftArticles from '@/articles/nft.json';
import promptsArticles from '@/articles/prompts.json';
import storybookArticles from '@/articles/storybook.json';
import stylesArticles from '@/articles/styles.json';
import technologyArticles from '@/articles/technology.json';
import trendsArticles from '@/articles/trends.json';
import tutorialsArticles from '@/articles/tutorials.json';
import usecasesArticles from '@/articles/usecases.json';


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
  // Defaulting the status to 'published' ensures that even if the field
  // is missing from the JSON, the article will be treated as published.
  status: z.enum(['published', 'draft']).default('published'),
  publishedDate: z.string().datetime(),
  summary: z.string().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
  keyTakeaways: z.array(z.string()),
  conclusion: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

const ArticleFileSchema = z.array(ArticleSchema);

// A map to hold all imported article data, connecting slug to the imported JSON.
const allCategoryData: { [key: string]: any } = {
    'featured': featuredArticles,
    'inspiration': inspirationArticles,
    'nft': nftArticles,
    'prompts': promptsArticles,
    'storybook': storybookArticles,
    'styles': stylesArticles,
    'technology': technologyArticles,
    'trends': trendsArticles,
    'tutorials': tutorialsArticles,
    'usecases': usecasesArticles
};

async function loadAndValidateArticles(category: string): Promise<Article[]> {
    // Find the corresponding slug for the given category name.
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category);
    
    if (!categorySlug) {
        console.log(`No slug found for category "${category}"`);
        return [];
    }

    // Retrieve the imported JSON data from our map.
    const articlesData = allCategoryData[categorySlug];

    if (!articlesData) {
        console.log(`No article data found for category slug "${categorySlug}"`);
        return [];
    }
    
    try {
        // Validate the data against our Zod schema.
        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            return validatedArticles.data;
        } else {
            console.error(`Zod validation failed for category "${category}".`, validatedArticles.error.flatten());
            return [];
        }

    } catch (error: any) {
        console.error(`Error validating articles for category "${category}":`, error.message);
        return [];
    }
}

// For public-facing pages: gets ONLY published articles.
// This now correctly defaults status to 'published' if it's missing.
export async function getArticles(category: string): Promise<Article[]> {
    const allArticles = await loadAndValidateArticles(category);
    return allArticles.filter(article => article.status === 'published');
}

// For admin pages: gets ALL articles, including drafts.
export async function getAllArticlesAdmin(category: string): Promise<Article[]> {
    const allArticles = await loadAndValidateArticles(category);
    return allArticles;
}
