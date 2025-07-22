
'use server';

import { z } from 'zod';
import { categorySlugMap } from '@/lib/constants';
import { ArticleSchema } from '@/lib/types';
import { getFile } from './github';

export type { Article, ArticleContentBlock } from './types';

async function loadArticlesFromGitHub(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  const categorySlug = Object.keys(categorySlugMap).find(
      (key) => categorySlugMap[key] === category
    ) || category; 

  if (!categorySlug) {
    console.error(`No slug found for category "${category}"`);
    return [];
  }

  const filePath = `src/articles/${categorySlug}.json`;
  const fileContent = await getFile(filePath);

  if (!fileContent) {
    return [];
  }

  try {
    const articlesData = JSON.parse(fileContent);
    const validatedArticles = z.array(ArticleSchema).safeParse(articlesData);

    if (validatedArticles.success) {
      return validatedArticles.data.map((article) => ({
        ...article,
        publishedDate: article.publishedDate || new Date().toISOString(),
      }));
    } else {
      console.error(
        `Zod validation failed for category "${category}" from GitHub.`,
        validatedArticles.error.flatten()
      );
      return [];
    }
  } catch (error: any) {
    console.error(
      `Error parsing or validating articles for category "${category}" from GitHub:`,
      error.message
    );
    return [];
  }
}


// Gets only published articles
export async function getArticles(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  const allArticles = await loadArticlesFromGitHub(category);
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
  const allArticles = await loadArticlesFromGitHub(category);
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
  const allCategories = Object.values(categorySlugMap);
  allCategories.push('drafts'); // Add drafts to the search list
  
  for (const catName of allCategories) {
      const articles = await getAllArticlesAdmin(catName);
      const foundArticle = articles.find(a => a.slug === slug);
      if (foundArticle) return foundArticle;
  }

  return undefined;
}
