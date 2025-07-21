
'use server';

import { z } from 'zod';
import { categorySlugMap } from '@/lib/constants';
import {
  ArticleSchema,
  type Article,
  type ArticleContentBlock,
} from '@/lib/types';
import { Octokit } from 'octokit';

// Direct imports to ensure files are bundled during the build process.
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
// Import drafts if the file exists, otherwise use an empty array.
import draftArticles from '@/articles/drafts.json';

export type { Article, ArticleContentBlock } from './types';

const ArticleFileSchema = z.array(ArticleSchema);

// A map to hold all imported article data, connecting slug to the imported JSON.
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
    ) || category; // Fallback for 'drafts'

  if (!categorySlug) {
    console.error(`No slug found for category "${category}"`);
    return [];
  }

  const articlesData = allCategoryData[categorySlug];

  if (!articlesData) {
    // This is normal for the drafts file if it doesn't exist yet
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

// For public-facing pages: gets ONLY published articles.
export async function getArticles(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  const allArticles = await loadAndValidateArticles(category);
  return allArticles.filter((article) => article.status === 'published');
}

// For admin pages: gets ALL articles from a specific category, including drafts within that file.
export async function getAllArticlesAdmin(
  category: string
): Promise<z.infer<typeof ArticleSchema>[]> {
  return await loadAndValidateArticles(category);
}

// For editing page: get a single article, checking drafts first
export async function getArticleForEdit(
  category: string,
  slug: string
): Promise<Article | undefined> {
  const allCategories = [...Object.values(categorySlugMap), 'drafts'];
  for (const catName of allCategories) {
      const articles = await getAllArticlesAdmin(catName);
      const foundArticle = articles.find(a => a.slug === slug);
      if (foundArticle) return foundArticle;
  }
  return undefined;
}


// Reusable GitHub helper functions
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

// Find a single article by slug across all categories (including drafts)
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const allCategories = [...Object.values(categorySlugMap), 'drafts'];
  for (const category of allCategories) {
    const articles = await getAllArticlesAdmin(category);
    const found = articles.find(a => a.slug === slug);
    if (found) return found;
  }
  return undefined;
}

// Save an article, handling create vs. update logic.
export async function saveArticle(
  articleData: Article,
  isNew: boolean,
  originalCategory?: string,
  originalStatus?: 'published' | 'draft'
) {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      throw new Error("GitHub credentials are not configured on the server.");
    }
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
    
    const targetCategory = articleData.status === 'draft' ? 'drafts' : articleData.category;
    const targetCategorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === targetCategory) || 'drafts';
    const targetRepoPath = `src/articles/${targetCategorySlug}.json`;
    
    // Fetch the target article list
    let targetArticles = await getAllArticlesAdmin(targetCategory);
    
    if (isNew) {
      targetArticles.unshift(articleData);
    } else {
      const index = targetArticles.findIndex(a => a.slug === articleData.originalSlug);
      if (index > -1) {
        targetArticles[index] = articleData;
      } else {
        // If it wasn't in the target list, it might have moved (e.g., from drafts to published)
        targetArticles.unshift(articleData);
      }
    }
    
    // If the category or status changed, we also need to remove it from the old list
    const oldCategory = originalStatus === 'draft' ? 'drafts' : originalCategory;
    if (!isNew && oldCategory && oldCategory !== targetCategory) {
        let oldArticles = await getAllArticlesAdmin(oldCategory);
        const articlesToKeep = oldArticles.filter(a => a.slug !== articleData.originalSlug);
        const oldCategorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === oldCategory) || 'drafts';
        const oldRepoPath = `src/articles/${oldCategorySlug}.json`;
        const oldFileContent = JSON.stringify(articlesToKeep, null, 2);
        const oldFileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, oldRepoPath, branch);
        
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          path: oldRepoPath,
          message: `chore: 📚 Remove moved article "${articleData.slug}"`,
          content: Buffer.from(oldFileContent).toString('base64'),
          sha: oldFileSha,
          branch,
        });
    }

    // Now, save the updated target list
    const newFileContent = JSON.stringify(targetArticles, null, 2);
    const newFileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, targetRepoPath, branch);
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: targetRepoPath,
      message: `feat: ✍️ ${isNew ? 'Create' : 'Update'} article "${articleData.slug}"`,
      content: Buffer.from(newFileContent).toString('base64'),
      sha: newFileSha,
      branch,
    });
}
