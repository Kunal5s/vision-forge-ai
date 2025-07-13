
'use server';

import { generateArticleForTopic } from '@/ai/article-generator';
import { getArticles, Article } from '@/lib/articles';
import { z } from 'zod';
import { Octokit } from 'octokit';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
  prompt: z.string(),
  category: z.string(),
  model: z.string(),
  style: z.string(),
  mood: z.string(),
  wordCount: z.string(),
  apiKey: z.string().optional(), // API Key is optional
});

type GenerateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
};

// Main server action
export async function generateArticleAction(data: unknown): Promise<GenerateArticleResult> {
  const validatedFields = FormSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten());
    return { success: false, error: 'Invalid input data.' };
  }
  
  const { prompt, category, model, style, mood, wordCount, apiKey } = validatedFields.data;

  try {
    // Correctly pass all parameters to the generation function
    const newArticle = await generateArticleForTopic({ 
      prompt, 
      category, 
      model, 
      style, 
      mood, 
      wordCount, 
      apiKey 
    });

    if (!newArticle) {
      throw new Error('AI failed to generate the article. The model might be busy, the topic too complex, or the response format incorrect. Please try a different model or topic.');
    }
    
    // Save the article to file and optionally to GitHub
    await saveArticle(newArticle, category);

    // Revalidate paths to show new content immediately
    revalidatePath('/');
    revalidatePath('/blog');
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    
    return { success: true, title: newArticle.title };

  } catch (error) {
    console.error('Error in generateArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

// --- Helper functions for saving ---

async function getShaForFile(octokit: Octokit, owner: string, repo: string, path: string): Promise<string | undefined> {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
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

async function saveArticle(newArticle: Article, category: string) {
    console.log(`Saving new article "${newArticle.title}" to category "${category}"`);
    
    // Always read the existing articles to append, not overwrite.
    const existingArticles = await getArticles(category);
    const updatedArticles = [newArticle, ...existingArticles]; // Prepend the new article

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);
    const fileContent = JSON.stringify(updatedArticles, null, 2);

    // Save to local file system
    await fs.writeFile(filePath, fileContent, 'utf-8');
    console.log(`Successfully saved ${updatedArticles.length} articles locally to ${filePath}`);
    
    // --- GitHub Integration ---
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;

    if (GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME) {
        try {
            const octokit = new Octokit({ auth: GITHUB_TOKEN });
            const repoPath = `src/articles/${categorySlug}.json`;
            const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath);
            
            await octokit.rest.repos.createOrUpdateFileContents({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                path: repoPath,
                message: `feat: ✨ Add new article "${newArticle.title}"`,
                content: Buffer.from(fileContent).toString('base64'),
                sha: fileSha,
            });
            console.log(`Successfully committed new article for "${category}" to GitHub.`);
        } catch (error) {
            console.error("Failed to commit changes to GitHub. The local file was saved.", error);
            // We don't re-throw here, as local saving might be sufficient for some workflows
        }
    } else {
        console.log("GitHub credentials not set. Skipping commit to repository.");
    }
}
