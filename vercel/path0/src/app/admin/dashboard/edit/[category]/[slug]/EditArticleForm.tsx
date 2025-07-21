'use server';

import { z } from 'zod';
import { JSDOM } from 'jsdom';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Octokit } from 'octokit';
import { generateArticleForTopic } from '@/ai/article-generator';

import { categorySlugMap } from '@/lib/constants';
import {
  ArticleSchema,
  type Article,
  ManualArticleSchema,
  type ArticleContentBlock,
} from '@/lib/types';
import {
  getAllArticlesAdmin,
  getPrimaryBranch,
  getShaForFile,
} from '@/lib/articles';


// This function uses JSDOM and must only be used on the server.
// It is NOT exported, so it's a private utility for this module.
function htmlToArticleContent(html: string): ArticleContentBlock[] {
    if (!html) return [];
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const content: ArticleContentBlock[] = [];

    document.body.childNodes.forEach((node) => {
        if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote'].includes(tagName)) {
                 const outerHTML = element.outerHTML.trim();
                 if (outerHTML) {
                    content.push({ type: tagName as ArticleContentBlock['type'], content: outerHTML, alt: '' });
                 }
            } 
            else if (element.querySelector('table')) { // Handles tables that might be wrapped in divs
                const table = element.querySelector('table');
                if (table) {
                    content.push({ type: 'table', content: table.outerHTML.trim(), alt: '' });
                }
            }
            else if (element.querySelector('img')) { // Handles images that might be wrapped
                const img = element.querySelector('img');
                if (img?.src) {
                    content.push({ type: 'img', content: img.src, alt: img.alt || '' });
                }
            } else if (tagName === 'img' && element.hasAttribute('src')) { // Handles direct image tags
                content.push({ type: 'img', content: element.getAttribute('src')!, alt: element.getAttribute('alt') || '' });
            }
        }
    });
    
    return content.filter(block => (block.content && block.content.trim() !== '' && block.content !== '<p></p>') || block.type === 'img');
}


async function saveUpdatedArticles(
  category: string,
  articles: Article[],
  commitMessage: string
) {
  const categorySlug = Object.keys(categorySlugMap).find(
    (key) => categorySlugMap[key] === category
  ) || category; // Fallback for 'drafts'

  if (!categorySlug) {
    throw new Error(`Invalid category name provided: ${category}`);
  }

  const repoPath = `src/articles/${categorySlug}.json`;
  const fileContent = JSON.stringify(articles, null, 2);

  const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
    throw new Error(
      'GitHub credentials not configured. Please check server environment variables.'
    );
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const branch = await getPrimaryBranch(
      octokit,
      GITHUB_REPO_OWNER,
      GITHUB_REPO_NAME
    );
    const fileSha = await getShaForFile(
      octokit,
      GITHUB_REPO_OWNER,
      GITHUB_REPO_NAME,
      repoPath,
      branch
    );

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: repoPath,
      message: commitMessage,
      content: Buffer.from(fileContent).toString('base64'),
      sha: fileSha,
      branch: branch,
    });
  } catch (error: any) {
    console.error(
      `Failed to commit changes to GitHub for file ${repoPath}`,
      error
    );
    throw new Error(
      'Failed to save to GitHub. Please check your credentials and repository permissions.'
    );
  }
}

export async function addImagesToArticleAction(
  content: string,
  imageCount: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const dom = new JSDOM(`<body>${content}</body>`);
    const document = dom.window.document;
    
    // Remove any previously AI-generated images to avoid duplicates
    document.querySelectorAll('img[src*="pollinations.ai"]').forEach(img => {
      // If the image is wrapped in a div (our standard structure), remove the div.
      if (img.parentElement?.tagName.toLowerCase() === 'div' && img.parentElement.classList.contains('my-8')) {
        img.parentElement.remove();
      } else {
        img.remove();
      }
    });
    
    const insertionPoints = Array.from(document.querySelectorAll('h2, h3'));
    const validPoints = insertionPoints.filter(p => p.textContent && p.textContent.trim().length > 10);
    
    if (validPoints.length === 0) {
      return { success: false, error: 'No suitable locations found. Add some H2 or H3 subheadings.' };
    }

    const numToAdd = Math.min(imageCount, validPoints.length);
    
    for (let i = 0; i < numToAdd; i++) {
        // Distribute images more evenly
        const pointIndex = Math.floor(i * (validPoints.length / numToAdd));
        const point = validPoints[pointIndex];
        
        const topic = (point.textContent || 'relevant photography').substring(0, 100);
        const seed = Math.floor(Math.random() * 1_000_000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${topic}, relevant photography, high detail, cinematic`)}?width=800&height=450&seed=${seed}&nologo=true`;

        const container = document.createElement('div');
        container.className = 'my-8';
        const img = document.createElement('img');
        img.src = url;
        img.alt = topic;
        img.className = 'rounded-lg shadow-lg mx-auto';
        container.appendChild(img);
        
        // Insert the image after the heading
        point.parentNode?.insertBefore(container, point.nextSibling);
    }
    return { success: true, content: document.body.innerHTML };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Action to save a new article, either as draft or published
export async function createManualArticleAction(data: unknown) {
    const validatedFields = ManualArticleSchema.safeParse(data);
    if (!validatedFields.success) return { success: false, error: 'Invalid data.' };
    
    const { title, slug, category, status, summary, content, image } = validatedFields.data;
    
    try {
        const articleContent = htmlToArticleContent(content);
        const newArticleData: Article = {
            title, slug, category, status, image, dataAiHint: 'manual content',
            publishedDate: new Date().toISOString(),
            summary: summary || '', articleContent,
        };
        
        const finalValidatedArticle = ArticleSchema.safeParse(newArticleData);
        if (!finalValidatedArticle.success) return { success: false, error: 'Failed to process data.' };
        
        await saveArticle(finalValidatedArticle.data, true);

        revalidatePaths(slug, category);
        return { success: true, title, slug, category };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// Action to save an edited article
export async function editArticleAction(data: unknown) {
    const validatedFields = ManualArticleSchema.safeParse(data);
    if (!validatedFields.success) return { success: false, error: 'Invalid data.' };
    
    const { title, slug, summary, content, originalSlug, originalStatus, category, status, image } = validatedFields.data;
    
    try {
        const existingArticle = await getArticleBySlug(originalSlug!);
        if (!existingArticle) throw new Error('Original article not found.');

        const newArticleContent = htmlToArticleContent(content);
        const updatedArticleData: Article = {
            ...existingArticle, title, slug, summary: summary || '', status, image,
            articleContent: newArticleContent.length > 0 ? newArticleContent : existingArticle.articleContent,
            category,
            publishedDate: (status === 'published' && existingArticle.status !== 'published') ? new Date().toISOString() : existingArticle.publishedDate
        };
        
        await saveArticle(updatedArticleData, false, existingArticle.category, originalStatus);
        
        revalidatePaths(slug, category);
        if (originalSlug !== slug) revalidatePaths(originalSlug, category);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
    
    redirect('/admin/dashboard/edit');
}

// Action to delete an article
export async function deleteArticleAction(category: string, slug: string, isDraft: boolean) {
    try {
        const categoryName = isDraft ? 'drafts' : category;
        let articles = await getAllArticlesAdmin(categoryName);
        const updatedArticles = articles.filter(a => a.slug !== slug);

        if (articles.length === updatedArticles.length) {
            console.warn(`Article to delete (${slug}) not found in ${categoryName}.json`);
        } else {
            await saveUpdatedArticles(categoryName, updatedArticles, `feat: 🗑️ Delete article "${slug}"`);
        }
        
        revalidatePaths(slug, category);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
    redirect('/admin/dashboard/edit');
}

// Helper function to find an article by slug across all categories
async function getArticleBySlug(slug: string): Promise<Article | undefined> {
    const categories = Object.values(categorySlugMap);
    categories.push('drafts');
    for (const category of categories) {
        const articles = await getAllArticlesAdmin(category);
        const found = articles.find(a => a.slug === slug);
        if (found) return found;
    }
    return undefined;
}


// A unified save function to handle all article updates
export async function saveArticle(article: Article, isNew: boolean, oldCategory?: string, oldStatus?: 'published' | 'draft') {
    const newCategory = article.category;
    const newStatusIsDraft = article.status === 'draft';
    const targetFileCategory = newStatusIsDraft ? 'drafts' : newCategory;
    
    let articles = await getAllArticlesAdmin(targetFileCategory);

    const existingIndex = articles.findIndex(a => a.slug === article.slug);
    if (existingIndex > -1) {
        articles[existingIndex] = article;
    } else {
        articles.unshift(article);
    }

    await saveUpdatedArticles(targetFileCategory, articles, `feat: ✨ Update/add article "${article.title}"`);

    // If the article moved category or status, remove it from the old location
    if (!isNew && oldCategory && oldStatus) {
        const oldFileCategory = oldStatus === 'draft' ? 'drafts' : oldCategory;
        const newFileCategory = newStatusIsDraft ? 'drafts' : newCategory;
        
        if (oldFileCategory !== newFileCategory) {
            let oldArticles = await getAllArticlesAdmin(oldFileCategory);
            const updatedOldArticles = oldArticles.filter(a => a.slug !== article.slug);
            if (oldArticles.length !== updatedOldArticles.length) {
                await saveUpdatedArticles(oldFileCategory, updatedOldArticles, `refactor: 🧹 Move article "${article.slug}" from ${oldFileCategory}`);
            }
        }
    }
}

// Revalidate relevant paths
function revalidatePaths(slug: string, categoryName: string) {
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === categoryName) || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath('/');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/admin/dashboard/edit');
}

// Autosave function for drafts
export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string }> {
  const validatedFields = ManualArticleSchema.safeParse(data);
  if (!validatedFields.success) return { success: false, error: 'Invalid data.' };

  const { title, slug, category, summary, content, image } = validatedFields.data;
  if (!slug || !category || !title) {
    return { success: false, error: "Title, slug, and category are required for auto-saving." };
  }

  try {
    const articleContent = htmlToArticleContent(content);
    const draftArticleData: Article = {
      title, slug, category, status: 'draft', image: image || 'https://placehold.co/600x400.png',
      dataAiHint: 'draft content',
      publishedDate: new Date().toISOString(),
      summary: summary || '',
      articleContent,
    };
    
    let drafts = await getAllArticlesAdmin('drafts');
    const existingIndex = drafts.findIndex(d => d.slug === slug);
    if (existingIndex > -1) {
        drafts[existingIndex] = draftArticleData;
    } else {
        drafts.unshift(draftArticleData);
    }
    
    await saveUpdatedArticles('drafts', drafts, `chore(autosave): ✍️ auto-save draft for "${title}"`);
    revalidatePath('/admin/dashboard/edit');
    return { success: true };
  } catch (e: any) {
    console.error("Autosave failed:", e.message);
    return { success: false, error: e.message };
  }
}