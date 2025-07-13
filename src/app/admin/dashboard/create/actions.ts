
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
      throw new Error('AI failed to generate the article. The model might be busy, the topic too complex, or the response format incorrect. Please try a different model or topic, or check your API key credits.');
    }
    
    // Save the article to file and optionally to GitHub
    await saveUpdatedArticles(category, [newArticle, ...(await getArticles(category))], `feat: ✨ Add new AI article "${newArticle.title}"`);

    // Revalidate paths to show new content immediately
    revalidatePath('/');
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
    
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


const EditSchema = z.object({
    title: z.string().min(1, "Title cannot be empty."),
    slug: z.string().min(1, "Slug cannot be empty."),
    content: z.string(), // This will hold raw Markdown content from the textarea
    originalSlug: z.string(),
    category: z.string(),
});

// Helper function to parse Markdown into article content blocks
function parseMarkdownToContent(markdown: string): Article['articleContent'] {
  const lines = markdown.split(/\n\s*\n/); // Split by blank lines
  return lines.map(line => {
    line = line.trim();
    if (line.startsWith('###### ')) return { type: 'h6', content: line.substring(7) };
    if (line.startsWith('##### ')) return { type: 'h5', content: line.substring(6) };
    if (line.startsWith('#### ')) return { type: 'h4', content: line.substring(5) };
    if (line.startsWith('### ')) return { type: 'h3', content: line.substring(4) };
    if (line.startsWith('## ')) return { type: 'h2', content: line.substring(3) };
    // Note: We don't support H1 from markdown to prevent conflicting with the main article title.
    if (line.length > 0) return { type: 'p', content: line };
    return { type: 'p', content: '' }; // Should be filtered out
  }).filter(block => block.content.length > 0);
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
    
    // Parse the markdown content back into the structured array
    const newArticleContent = parseMarkdownToContent(content);

    const updatedArticle = {
      ...articles[articleIndex],
      title,
      slug,
      articleContent: newArticleContent,
      publishedDate: new Date().toISOString(), // Update published date on edit
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

// Universal function to save articles to GitHub
export async function saveUpdatedArticles(category: string, articles: Article[], commitMessage: string) {
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const repoPath = `src/articles/${categorySlug}.json`;
    const fileContent = JSON.stringify(articles, null, 2);

    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.error("GitHub credentials are not configured on the server. Cannot save article.");
        throw new Error("GitHub credentials are not configured on the server. Article saving is disabled.");
    }

    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath);
        
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: commitMessage,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: 'main', // Explicitly specify the branch
        });
        console.log(`Successfully committed changes for "${category}" to GitHub.`);
    } catch (error) {
        console.error("Failed to commit changes to GitHub.", error);
        throw new Error("Failed to save article to GitHub. Please check your credentials and repository permissions.");
    }
}
