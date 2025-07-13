
'use server';

import { getArticles, Article, ArticleContentBlock } from '@/lib/articles';
import { z } from 'zod';
import { Octokit } from 'octokit';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const ManualArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  slug: z.string().min(5, 'Slug must be at least 5 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  content: z.string().min(50, 'Content must be at least 50 characters long.'),
  keyTakeaways: z.string().min(10, 'Please provide a few key takeaways.'),
  conclusion: z.string().min(20, 'Conclusion must be at least 20 characters long.'),
});

type CreateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
};

// Helper function to parse Markdown into article content blocks
function parseMarkdownToContent(markdown: string): ArticleContentBlock[] {
  const lines = markdown.split(/\n\s*\n/); // Split by blank lines
  return lines.map(line => {
    line = line.trim();
    if (line.startsWith('###### ')) return { type: 'h6', content: line.substring(7) };
    if (line.startsWith('##### ')) return { type: 'h5', content: line.substring(6) };
    if (line.startsWith('#### ')) return { type: 'h4', content: line.substring(5) };
    if (line.startsWith('### ')) return { type: 'h3', content: line.substring(4) };
    if (line.startsWith('## ')) return { type: 'h2', content: line.substring(3) };
    if (line.length > 0) return { type: 'p', content: line };
    return { type: 'p', content: '' }; // Should be filtered out
  }).filter(block => block.content.length > 0);
}


// Main server action for manual creation
export async function createManualArticleAction(data: unknown): Promise<CreateArticleResult> {
  const validatedFields = ManualArticleSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten());
    return { success: false, error: 'Invalid input data.' };
  }
  
  const { title, slug, category, content, keyTakeaways, conclusion } = validatedFields.data;

  try {
    const articleContent = parseMarkdownToContent(content);
    
    // Create a new article object
    const newArticle: Article = {
      title,
      slug,
      category,
      articleContent,
      keyTakeaways: keyTakeaways.split(',').map(k => k.trim()), // Split takeaways string into an array
      conclusion,
      image: `https://placehold.co/600x400.png`, // Placeholder image
      dataAiHint: "manual content",
      publishedDate: new Date().toISOString(),
    };
    
    // Save the article to file and optionally to GitHub
    await saveArticle(newArticle, category);

    // Revalidate paths to show new content immediately
    revalidatePath('/');
    revalidatePath('/blog');
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
    
    return { success: true, title: newArticle.title };

  } catch (error) {
    console.error('Error in createManualArticleAction:', error);
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
    console.log(`Saving new manual article "${newArticle.title}" to category "${category}"`);
    
    const existingArticles = await getArticles(category);
    const updatedArticles = [newArticle, ...existingArticles]; // Prepend the new article

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);
    const fileContent = JSON.stringify(updatedArticles, null, 2);

    await fs.writeFile(filePath, fileContent, 'utf-8');
    console.log(`Successfully saved ${updatedArticles.length} articles locally to ${filePath}`);
    
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
                message: `feat: ✨ Add new manual article "${newArticle.title}"`,
                content: Buffer.from(fileContent).toString('base64'),
                sha: fileSha,
            });
            console.log(`Successfully committed new article for "${category}" to GitHub.`);
        } catch (error) {
            console.error("Failed to commit changes to GitHub. The local file was saved.", error);
        }
    } else {
        console.log("GitHub credentials not set. Skipping commit to repository.");
    }
}
