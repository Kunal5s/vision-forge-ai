
'use server';

import { generateArticleForTopic } from '@/ai/article-generator';
import { getArticles, Article } from '@/lib/articles';
import { z } from 'zod';
import { Octokit } from 'octokit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  model: z.string().min(1, 'Please select an AI model.'),
  style: z.string().min(1, 'Please select a writing style.'),
  mood: z.string().min(1, 'Please select an article mood.'),
  wordCount: z.string().min(1, 'Please select a word count.'),
  apiKey: z.string().optional(), // API Key is optional
});

type GenerateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
};

export async function generateArticleAction(data: unknown): Promise<GenerateArticleResult> {
  const validatedFields = FormSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten());
    return { success: false, error: 'Invalid input data.' };
  }
  
  const { prompt, category, model, style, mood, wordCount, apiKey } = validatedFields.data;

  try {
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
      throw new Error('AI failed to generate the article. The model might be busy, the topic too complex, or the response format incorrect. Please try a different model or topic, or check your API key credits.');
    }
    
    await saveUpdatedArticles(category, [newArticle, ...(await getArticles(category))], `feat: ✨ Add new AI article "${newArticle.title}"`);

    revalidatePath('/');
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
    
    // On success, redirect to the new article's edit page
    redirect('/admin/dashboard/edit');

  } catch (error) {
    console.error('Error in generateArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

async function getShaForFile(octokit: Octokit, owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
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

const EditSchema = z.object({
    title: z.string().min(1, "Title cannot be empty."),
    slug: z.string().min(1, "Slug cannot be empty."),
    content: z.string(), 
    originalSlug: z.string(),
    category: z.string(),
});

function parseMarkdownToContent(markdown: string): Article['articleContent'] {
  const lines = markdown.split(/\n\s*\n/); 
  return lines.map(line => {
    line = line.trim();
    if (line.startsWith('## ')) return { type: 'h2', content: line.substring(3) };
    if (line.startsWith('### ')) return { type: 'h3', content: line.substring(4) };
    if (line.startsWith('#### ')) return { type: 'h4', content: line.substring(5) };
    if (line.startsWith('##### ')) return { type: 'h5', content: line.substring(6) };
    if (line.startsWith('###### ')) return { type: 'h6', content: line.substring(7) };
    if (line.startsWith('# ')) return { type: 'h1', content: line.substring(2) };
    if (line.startsWith('![')) { 
        const match = /!\[(.*?)\]\((.*?)\)/.exec(line);
        if (match) {
            return { type: 'img', content: match[2], alt: match[1] };
        }
    }
    if (line.length > 0) return { type: 'p', content: line };
    return { type: 'p', content: '' };
  }).filter(block => (block.type && block.content.length > 0) || block.type === 'img');
}

export async function editArticleAction(data: unknown) {
  const validatedFields = EditSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid data." };
  }
  const { title, slug, content, originalSlug, category } = validatedFields.data;

  try {
    const articles = await getArticles(category);
    const articleIndex = articles.findIndex(a => a.slug === originalSlug);

    if (articleIndex === -1) {
      throw new Error("Article not found.");
    }
    
    const newArticleContent = parseMarkdownToContent(content);

    const updatedArticle = {
      ...articles[articleIndex],
      title,
      slug,
      articleContent: newArticleContent,
      publishedDate: new Date().toISOString(), 
    };

    articles[articleIndex] = updatedArticle;

    await saveUpdatedArticles(category, articles, `feat: ✏️ Edit article "${title}"`);
    
    revalidatePath(`/`);
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);

  } catch (e: any) {
    return { success: false, error: e.message };
  }
  
  redirect('/admin/dashboard/edit');
}

export async function deleteArticleAction(category: string, slug: string) {
    try {
        const articles = await getArticles(category);
        const updatedArticles = articles.filter(a => a.slug !== slug);
        
        if (articles.length === updatedArticles.length) {
            throw new Error("Article to delete was not found.");
        }

        await saveUpdatedArticles(category, updatedArticles, `feat: 🗑️ Delete article with slug "${slug}"`);

        revalidatePath(`/`);
        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        revalidatePath(`/${categorySlug}`);

    } catch (e: any) {
        return { success: false, error: e.message };
    }

    redirect('/admin/dashboard/edit');
}

async function getPrimaryBranch(octokit: Octokit, owner: string, repo: string): Promise<string> {
    // 1. Check for GITHUB_BRANCH environment variable first for manual override
    if (process.env.GITHUB_BRANCH) {
        return process.env.GITHUB_BRANCH;
    }
    // 2. Try 'main' first, as it's the modern default
    try {
        await octokit.rest.repos.getBranch({ owner, repo, branch: 'main' });
        return 'main';
    } catch (error: any) {
        // If 'main' doesn't exist (404), fall back to 'master'
        if (error.status === 404) {
            try {
                await octokit.rest.repos.getBranch({ owner, repo, branch: 'master' });
                return 'master';
            } catch (masterError) {
                 console.error("Could not find 'main' or 'master' branch.", masterError);
                 throw new Error("Could not determine primary branch. Neither 'main' nor 'master' found.");
            }
        }
        // Rethrow other errors
        throw error;
    }
}

export async function saveUpdatedArticles(category: string, articles: Article[], commitMessage: string) {
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const repoPath = `src/articles/${categorySlug}.json`;
    const fileContent = JSON.stringify(articles, null, 2);

    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.error("GitHub credentials are not configured on the server. Cannot save article.");
        throw new Error("GitHub credentials not configured. Please check Vercel environment variables. Make sure GITHUB_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME are all set.");
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
        console.log(`Successfully committed changes for "${category}" to GitHub on branch "${branch}".`);
    } catch (error) {
        console.error("Failed to commit changes to GitHub.", error);
        throw new Error("Failed to save article to GitHub. Please check your credentials (token, owner, repo name) and repository permissions.");
    }
}
