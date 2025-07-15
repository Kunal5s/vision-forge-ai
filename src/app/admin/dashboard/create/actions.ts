
'use server';

import { generateArticleForTopic } from '@/ai/article-generator';
import { getArticles, Article } from '@/lib/articles';
import { z } from 'zod';
import { Octokit } from 'octokit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { JSDOM } from 'jsdom';

// Schema for the final article generation submission
const ArticleFormSchema = z.object({
  topic: z.string().min(1, 'Please enter a topic.'),
  category: z.string().min(1, 'Please select a category.'),
  provider: z.enum(['openrouter', 'sambanova']),
  model: z.string().min(1, 'Please select an AI model.'),
  style: z.string().min(1, 'Please select a writing style.'),
  mood: z.string().min(1, 'Please select an article mood.'),
  wordCount: z.string().min(1, 'Please select a word count.'),
  imageCount: z.string().min(1, 'Please select the number of images.'),
  openRouterApiKey: z.string().optional(),
  sambaNovaApiKey: z.string().optional(),
});

type GenerateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
};

export async function generateArticleAction(data: unknown): Promise<GenerateArticleResult> {
  const validatedFields = ArticleFormSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten());
    return { success: false, error: 'Invalid input data for article generation.' };
  }
  
  const { 
    topic, 
    category, 
    provider,
    model, 
    style, 
    mood, 
    wordCount, 
    imageCount, 
    openRouterApiKey,
    sambaNovaApiKey
  } = validatedFields.data;
  
  const apiKey = provider === 'sambanova' ? sambaNovaApiKey : openRouterApiKey;

  try {
    const newArticle = await generateArticleForTopic({ 
      topic, 
      category, 
      provider,
      model, 
      style, 
      mood, 
      wordCount,
      imageCount,
      apiKey 
    });

    if (!newArticle) {
      throw new Error('AI failed to generate the article. This could be due to model unavailability, a complex topic, or an incorrect response format. Please try again with a different model or topic, or check your API key credits.');
    }
    
    await saveUpdatedArticles(category, [newArticle, ...(await getArticles(category))], `feat: ✨ Add new AI article "${newArticle.title}"`);

    revalidatePath('/');
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
    
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

function parseHtmlToContent(html: string): Article['articleContent'] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const content: Article['articleContent'] = [];
  
  document.body.childNodes.forEach(node => {
    if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName)) {
        const textContent = element.innerHTML.trim();
        if (textContent) {
          content.push({ type: tagName as any, content: textContent });
        }
      } else if (tagName === 'img' && element.hasAttribute('src')) {
        content.push({ type: 'img', content: element.getAttribute('src')!, alt: element.getAttribute('alt') || '' });
      }
    }
  });

  return content.filter(block => (block.content && block.content.trim() !== '') || block.type === 'img');
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
    
    const newArticleContent = parseHtmlToContent(content);

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

    