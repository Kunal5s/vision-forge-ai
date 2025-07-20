
'use server';

import { z } from 'zod';
import { categorySlugMap } from './constants';
import { ArticleSchema, type Article } from './types';
import { Octokit } from 'octokit';

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

export type { Article, ArticleContentBlock } from './types';

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

async function loadAndValidateArticles(category: string): Promise<z.infer<typeof ArticleSchema>[]> {
    // Find the corresponding slug for the given category name.
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category);
    
    if (!categorySlug) {
        console.error(`No slug found for category "${category}"`);
        return [];
    }

    // Retrieve the imported JSON data from our map using the correct slug.
    const articlesData = allCategoryData[categorySlug];

    if (!articlesData) {
        console.error(`No article data found for category slug "${categorySlug}"`);
        return [];
    }
    
    try {
        // Validate the data against our Zod schema.
        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            // Add a default publishedDate if it's missing
            return validatedArticles.data.map(article => ({
                ...article,
                publishedDate: article.publishedDate || new Date().toISOString()
            }));
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
export async function getArticles(category: string): Promise<z.infer<typeof ArticleSchema>[]> {
    const allArticles = await loadAndValidateArticles(category);
    return allArticles.filter(article => article.status === 'published');
}

// For admin pages: gets ALL articles, including drafts.
export async function getAllArticlesAdmin(category: string): Promise<z.infer<typeof ArticleSchema>[]> {
    const allArticles = await loadAndValidateArticles(category);
    return allArticles;
}

// Reusable GitHub helper functions
export async function getShaForFile(octokit: Octokit, owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
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
            return undefined;
        }
        throw error;
    }
}

export async function getPrimaryBranch(octokit: Octokit, owner: string, repo: string): Promise<string> {
    if (process.env.GITHUB_BRANCH) {
        return process.env.GITHUB_BRANCH;
    }
    try {
        await octokit.rest.repos.getBranch({ owner, repo, branch: 'main' });
        return 'main';
    } catch (error: any) {
        if (error.status === 404) {
            try {
                await octokit.rest.repos.getBranch({ owner, repo, branch: 'master' });
                return 'master';
            } catch (masterError) {
                 console.error("Could not find 'main' or 'master' branch.", masterError);
                 throw new Error("Could not determine primary branch. Neither 'main' nor 'master' found.");
            }
        }
        throw error;
    }
}

// Universal function to save updated articles to a specific category file on GitHub
export async function saveUpdatedArticles(category: string, articles: Article[], commitMessage: string) {
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category);
    if (!categorySlug) {
        throw new Error(`Invalid category name provided: ${category}`);
    }
    
    const repoPath = `src/articles/${categorySlug}.json`;
    const fileContent = JSON.stringify(articles, null, 2);

    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;

    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.error("GitHub credentials are not configured on the server. Cannot save articles.");
        throw new Error("GitHub credentials not configured. Please check server environment variables.");
    }

    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, branch);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: commitMessage,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: branch,
        });

        console.log(`Successfully committed article changes for category "${category}" to GitHub on branch "${branch}".`);

    } catch (error: any) {
        console.error("Failed to commit changes to GitHub for category " + category, error);
        throw new Error("Failed to save articles to GitHub. Please check your credentials and repository permissions.");
    }
}
