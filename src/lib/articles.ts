
'use server';

import { z } from 'zod';
import { categorySlugMap } from '@/lib/constants';
import { ArticleSchema } from '@/lib/types';
import { Octokit } from 'octokit';

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

const allCategoryData: { [key: string]: any } = {
  featured: featuredArticles,
  inspiration: inspirationArticles,
  nft: nftArticles,
  prompts: promptsArticles,
  storybook: storybookArticles,
  styles: stylesArticles,
  technology: technologyArticles,
  trends: trendsArticles,
  tutorials: tutorialsArticles,
  usecases: usecasesArticles,
  drafts: draftArticles,
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

export async function getArticles(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  const allArticles = await loadAndValidateArticles(category);
  return allArticles.filter((article) => article.status === 'published');
}

export async function getAllArticlesAdmin(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  return await loadAndValidateArticles(category);
}

export async function getArticleForEdit(
  category: string,
  slug: string
): Promise<z.infer<typeof ArticleSchema> | undefined> {
  const allCategories = [...Object.values(categorySlugMap), 'drafts'];
  for (const catName of allCategories) {
      const articles = await getAllArticlesAdmin(catName);
      const foundArticle = articles.find(a => a.slug === slug);
      if (foundArticle) return foundArticle;
  }
  return undefined;
}


export async function getShaForFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | undefined> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (Array.isArray(data) || !('sha' in data)) {
      return undefined;
    }
    return data.sha;
  } catch (error: any) {
    if (error.status === 404) {
      return undefined; // File doesn't exist, so no SHA
    }
    throw error;
  }
}

export async function getPrimaryBranch(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string> {
  if (process.env.GITHUB_BRANCH) {
    return process.env.GITHUB_BRANCH;
  }
  try {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    return repoData.default_branch;
  } catch (error) {
    console.error('Could not determine primary branch.', error);
    throw new Error('Could not determine primary branch for the repository.');
  }
}
