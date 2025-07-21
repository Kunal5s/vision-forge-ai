
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Octokit } from 'octokit';
import { JSDOM } from 'jsdom';

import { categorySlugMap } from '@/lib/constants';
import { ManualArticleSchema, type Article, type ArticleContentBlock } from '@/lib/types';
import { getAllArticlesAdmin, getPrimaryBranch, getShaForFile } from '@/lib/articles';

// This function uses JSDOM and must only be used on the server.
function htmlToArticleContent(html: string): ArticleContentBlock[] {
    if (!html) return [];
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const content: ArticleContentBlock[] = [];

    document.body.childNodes.forEach((node) => {
        if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote', 'table'].includes(tagName)) {
                 const outerHTML = element.outerHTML.trim();
                 if (outerHTML) {
                    content.push({ type: tagName as ArticleContentBlock['type'], content: outerHTML, alt: '' });
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

// Revalidate relevant paths
function revalidateArticlePaths(slug: string, categoryName: string) {
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === categoryName) || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath('/');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/admin/dashboard/edit');
}

// Save an article, handling create vs. update logic.
export async function saveArticle(data: unknown, isNew: boolean) {
    const validatedFields = ManualArticleSchema.safeParse(data);
    if (!validatedFields.success) {
      console.error("Save validation failed:", validatedFields.error.flatten());
      throw new Error('Invalid article data.');
    }
  
    const { title, slug, category, status, summary, content, image, originalSlug, originalStatus } = validatedFields.data;
  
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      throw new Error("GitHub credentials are not configured on the server.");
    }
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
  
    const articleContent = htmlToArticleContent(content);
  
    const newArticleData: Article = {
      title, slug, category, status, image,
      dataAiHint: 'manual content',
      publishedDate: new Date().toISOString(),
      summary: summary || '',
      articleContent,
    };
  
    const targetCategory = status === 'draft' ? 'drafts' : category;
    const targetCategorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === targetCategory) || 'drafts';
    const targetRepoPath = `src/articles/${targetCategorySlug}.json`;
  
    let targetArticles = await getAllArticlesAdmin(targetCategory);
  
    if (isNew) {
      targetArticles.unshift(newArticleData);
    } else {
      const index = targetArticles.findIndex(a => a.slug === originalSlug);
      if (index > -1) {
        targetArticles[index] = newArticleData;
      } else {
        targetArticles.unshift(newArticleData);
      }
    }
  
    const oldCategory = originalStatus === 'draft' ? 'drafts' : category;
    if (!isNew && oldCategory && oldCategory !== targetCategory) {
      let oldArticles = await getAllArticlesAdmin(oldCategory);
      const articlesToKeep = oldArticles.filter(a => a.slug !== originalSlug);
      const oldCategorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === oldCategory) || 'drafts';
      const oldRepoPath = `src/articles/${oldCategorySlug}.json`;
      const oldFileContent = JSON.stringify(articlesToKeep, null, 2);
      const oldFileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, oldRepoPath, branch);
  
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path: oldRepoPath,
        message: `chore: 📚 Remove moved article "${slug}"`,
        content: Buffer.from(oldFileContent).toString('base64'),
        sha: oldFileSha,
        branch,
      });
    }
  
    const newFileContent = JSON.stringify(targetArticles, null, 2);
    const newFileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, targetRepoPath, branch);
  
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: targetRepoPath,
      message: `feat: ✍️ ${isNew ? 'Create' : 'Update'} article "${slug}"`,
      content: Buffer.from(newFileContent).toString('base64'),
      sha: newFileSha,
      branch,
    });
  
    revalidateArticlePaths(slug, category);
    if (originalSlug && originalSlug !== slug) {
      revalidateArticlePaths(originalSlug, category);
    }
}

export async function deleteArticle(category: string, slug: string, isDraft: boolean) {
    const categoryName = isDraft ? 'drafts' : category;
    let articles = await getAllArticlesAdmin(categoryName);
    const updatedArticles = articles.filter(a => a.slug !== slug);

    if (articles.length === updatedArticles.length) {
        console.warn(`Article to delete (${slug}) not found in ${categoryName}.json`);
    } else {
        const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === categoryName) || categoryName;
        const repoPath = `src/articles/${categorySlug}.json`;
        const fileContent = JSON.stringify(updatedArticles, null, 2);
        
        const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
        if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) throw new Error('GitHub credentials not configured.');
        
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        const sha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, branch);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: `feat: 🗑️ Delete article "${slug}"`,
            content: Buffer.from(fileContent).toString('base64'),
            sha,
            branch,
        });
    }
    
    revalidateArticlePaths(slug, category);
}

export async function addImagesToArticle(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const dom = new JSDOM(`<body>${content}</body>`);
    const document = dom.window.document;
    
    document.querySelectorAll('img[src*="pollinations.ai"]').forEach(img => {
      const parent = img.parentElement;
      if (parent && parent.tagName.toLowerCase() === 'div' && parent.classList.contains('my-8')) {
        parent.remove();
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
        
        point.parentNode?.insertBefore(container, point.nextSibling);
    }
    return { success: true, content: document.body.innerHTML };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createManualArticle(data: unknown) {
  const validatedFields = ManualArticleSchema.safeParse(data);
  if (!validatedFields.success) {
      throw new Error('Invalid data.');
  }
  
  const { title, slug, category } = validatedFields.data;
  
  await saveArticle(data, true);

  return { title, slug, category };
}


export async function autoSaveArticleDraft(data: unknown): Promise<{ success: boolean; error?: string }> {
  const validatedFields = ManualArticleSchema.safeParse(data);
  if (!validatedFields.success) return { success: false, error: 'Invalid data.' };

  const { slug, category, title } = validatedFields.data;
  if (!slug || !category || !title) {
    return { success: false, error: "Title, slug, and category are required for auto-saving." };
  }

  try {
    // Treat autosave as an update to an existing draft or a creation of a new one
    await saveArticle(data, false); 
    
    revalidatePath('/admin/dashboard/edit');
    return { success: true };
  } catch (e: any) {
    console.error("Autosave failed:", e.message);
    return { success: false, error: e.message };
  }
}
