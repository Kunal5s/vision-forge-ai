
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Octokit } from 'octokit';
import { JSDOM } from 'jsdom';
import { categorySlugMap } from '@/lib/constants';
import { ManualArticleSchema, type Article, type ArticleContentBlock } from '@/lib/types';
import { saveArticle, getAllArticlesAdmin } from '@/lib/articles';

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


export async function addImagesToArticleAction(
  content: string,
  imageCount: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const dom = new JSDOM(`<body>${content}</body>`);
    const document = dom.window.document;
    
    document.querySelectorAll('img[src*="pollinations.ai"]').forEach(img => {
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
        
        await saveArticle(newArticleData, true);

        revalidateArticlePaths(slug, category);
        return { success: true, title, slug, category };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


export async function autoSaveArticleDraftAction(
  data: unknown
): Promise<{ success: boolean; error?: string }> {
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
    
    await saveArticle(draftArticleData, true);
    
    revalidatePath('/admin/dashboard/edit');
    return { success: true };
  } catch (e: any) {
    console.error("Autosave failed:", e.message);
    return { success: false, error: e.message };
  }
}
