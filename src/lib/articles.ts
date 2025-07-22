
'use server';

import { z } from 'zod';
import { categorySlugMap } from '@/lib/constants';
import { ArticleSchema } from '@/lib/types';

// Direct imports for reliability, assuming these are static JSON files.
// This approach removes the need for `fs` and works in all environments.
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
import draftArticles from '@/articles/drafts.json';

export type { Article, ArticleContentBlock } from './types';

const ArticleFileSchema = z.array(ArticleSchema);

// A map to hold all imported story data
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
  'usecases': usecasesArticles,
  'drafts': draftArticles,
};


async function loadAndValidateArticles(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  const categorySlug = Object.keys(categorySlugMap).find(
      (key) => categorySlugMap[key] === category
    ) || category; 

  if (!categorySlug) {
    console.error(`No slug found for category "${category}"`);
    return [];
  }

  const articlesData = allCategoryData[categorySlug];

  if (!articlesData) {
    if (category === 'drafts') return [];
    console.error(`No article data found for category slug "${categorySlug}"`);
    return [];
  }

  try {
    const validatedArticles = ArticleFileSchema.safeParse(articlesData);

    if (validatedArticles.success) {
      return validatedArticles.data.map((article) => ({
        ...article,
        publishedDate: article.publishedDate || new Date().toISOString(),
      }));
    } else {
      console.error(
        `Zod validation failed for category "${category}".`,
        validatedArticles.error.flatten()
      );
      return [];
    }
  } catch (error: any) {
    console.error(
      `Error validating articles for category "${category}":`,
      error.message
    );
    return [];
  }
}


// Gets only published articles
export async function getArticles(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  // In a real application, this would fetch from a database (like Xata)
  // For now, it continues to read from the local JSON files.
  const allArticles = await loadAndValidateArticles(category);
  return allArticles
    .filter((article) => article.status === 'published')
    .sort((a, b) => {
        if (a.publishedDate && b.publishedDate) {
            return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        }
        return a.title.localeCompare(b.title);
    });
}

// Gets all articles, including drafts (for admin)
export async function getAllArticlesAdmin(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  // In a real application, this would fetch from a database (like Xata)
  const allArticles = await loadAndValidateArticles(category);
  return allArticles.sort((a, b) => {
    if (a.publishedDate && b.publishedDate) {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    }
    return a.title.localeCompare(b.title);
  });
}

// Get a single article by its slug from any category (for edit page)
export async function getArticleForEdit(
  categorySlug: string,
  slug: string
): Promise<z.infer<typeof ArticleSchema> | undefined> {
  // In a real application, this would be a single query to the database
  const allCategories = Object.values(categorySlugMap);
  allCategories.push('drafts'); // Add drafts to the search list
  
  for (const catName of allCategories) {
      const articles = await getAllArticlesAdmin(catName);
      const foundArticle = articles.find(a => a.slug === slug);
      if (foundArticle) return foundArticle;
  }

  return undefined;
}