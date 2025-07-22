
'use server';

import { revalidatePath } from 'next/cache';
import { type Article, type ArticleContentBlock } from '@/lib/articles';
import { ManualArticleSchema, type ManualArticleFormData } from '@/lib/types';
import { categorySlugMap } from '@/lib/constants';
import { getFile, saveFile } from '@/lib/github';
import { JSDOM } from 'jsdom';
import { OpenAI } from 'openai';
import { OPENROUTER_MODELS } from '@/lib/constants';

// Helper to convert HTML back to structured content
function htmlToArticleContent(html: string): ArticleContentBlock[] {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const content: ArticleContentBlock[] = [];
    const elements = document.body.childNodes;

    elements.forEach(node => {
        if (node.nodeType === 1) { // Element node
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote'].includes(tagName)) {
                content.push({
                    type: tagName as any,
                    content: element.innerHTML.trim(),
                });
            } else if (tagName === 'div' && element.querySelector('img')) {
                 const img = element.querySelector('img')!;
                 content.push({
                    type: 'img',
                    content: img.src,
                    alt: img.alt || '',
                });
            } else if (tagName === 'table') {
                 content.push({
                    type: 'table',
                    content: element.outerHTML.trim(),
                 });
            }
        }
    });

    return content;
}

// --- MAIN SERVER ACTIONS ---

export async function editArticleAction(data: unknown) {
  const validatedFields = ManualArticleSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: "Validation failed. " + validatedFields.error.message };
  }

  const { title, slug, category, status, summary, content, image, originalSlug, originalStatus } = validatedFields.data;
  
  const wasDraft = originalStatus === 'draft';
  const isNowPublished = status === 'published';
  const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase();
  
  try {
    const article: Article = {
      title: `<strong>${title}</strong>`,
      slug,
      category,
      status,
      summary: summary || '',
      image,
      dataAiHint: 'manual-edit', // Provide a default
      articleContent: htmlToArticleContent(content),
      publishedDate: new Date().toISOString(),
    };

    // If the article was a draft and is now being published, or its category/slug changed, we need to move it.
    if (wasDraft && isNowPublished || originalSlug !== slug || categorySlug !== Object.keys(categorySlugMap).find(key => categorySlugMap[key] === article.category)?.toLowerCase()) {
        if (originalSlug) {
            await deleteArticleAction(originalStatus === 'draft' ? 'drafts' : category, originalSlug, wasDraft);
        }
    }
    
    // Save to the new/correct file
    const filePath = status === 'draft' ? `src/articles/drafts.json` : `src/articles/${categorySlug}.json`;
    const currentFileContent = await getFile(filePath);
    let allArticles: Article[] = currentFileContent ? JSON.parse(currentFileContent) : [];

    // Update or add the article
    const articleIndex = allArticles.findIndex(a => a.slug === (originalSlug || slug));
    if (articleIndex > -1) {
        allArticles[articleIndex] = article;
    } else {
        allArticles.unshift(article);
    }
    
    const newContent = JSON.stringify(allArticles, null, 2);
    await saveFile(filePath, newContent, `docs: update article "${title}"`);
    
    // Revalidate relevant paths
    revalidatePath('/admin/dashboard/edit');
    revalidatePath(`/blog?category=${category}`);
    if (status === 'published') {
        revalidatePath(`/${categorySlug}/${slug}`);
        if(originalSlug && originalSlug !== slug) {
            revalidatePath(`/${categorySlug}/${originalSlug}`);
        }
    }
    
  } catch (e: any) {
    console.error("Failed to edit/save article:", e);
    return { success: false, error: `Server error: ${e.message}` };
  }
}

export async function deleteArticleAction(category: string, slug: string, isDraft: boolean) {
    const categorySlug = isDraft ? 'drafts' : (Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase());
    const filePath = `src/articles/${categorySlug}.json`;

    try {
        const fileContent = await getFile(filePath);
        if (!fileContent) {
            throw new Error("Article file not found.");
        }
        let articles: Article[] = JSON.parse(fileContent);
        
        const updatedArticles = articles.filter(a => a.slug !== slug);
        
        await saveFile(filePath, JSON.stringify(updatedArticles, null, 2), `docs: delete article "${slug}"`);

        revalidatePath('/admin/dashboard/edit');
        if (!isDraft) {
            revalidatePath(`/blog?category=${categorySlug}`);
            revalidatePath(`/${categorySlug}/${slug}`);
        }

    } catch (e: any) {
        console.error("Failed to delete article:", e);
        return { success: false, error: `Server error: ${e.message}` };
    }
    // Redirect is handled on the client after successful deletion
}

export async function addImagesToArticleAction(content: string, imageCount: number): Promise<{ success: boolean; content?: string; error?: string }> {
    const dom = new JSDOM(`<div>${content}</div>`);
    const document = dom.window.document;
    const headings = document.querySelectorAll('h2, h3');
    
    if (headings.length === 0) {
        return { success: false, error: 'No H2 or H3 headings found to add images after.' };
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
        return { success: false, error: 'OpenRouter API key is not configured on the server.' };
    }

    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterKey,
    });

    try {
        const imagePromises = Array.from({ length: imageCount }).map((_, i) => {
            const heading = headings[i % headings.length]; // Cycle through headings
            const prompt = `A vivid, high-quality image related to: ${heading.textContent?.trim()}, digital art, high detail`;
            const seed = Math.floor(Math.random() * 1_000_000_000);
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&seed=${seed}&nologo=true`;
            return {
                url: pollinationsUrl,
                alt: heading.textContent || 'Article image',
                insertAfterNode: heading
            };
        });

        for (const imgData of imagePromises) {
            const imgDiv = document.createElement('div');
            // imgDiv.className = 'my-8'; // The editor will handle this class
            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = imgData.alt;
            img.className = 'rounded-lg shadow-md mx-auto';
            imgDiv.appendChild(img);
            imgData.insertAfterNode.parentNode?.insertBefore(imgDiv, imgData.insertAfterNode.nextSibling);
        }

        return { success: true, content: document.body.innerHTML };

    } catch (e: any) {
        return { success: false, error: `Failed to add images: ${e.message}` };
    }
}

// This function will handle auto-saving drafts
export async function autoSaveArticleDraftAction(data: unknown): Promise<{ success: boolean; error?: string }> {
    const validatedFields = ManualArticleSchema.safeParse(data);
    if (!validatedFields.success) {
        return { success: false, error: "Validation failed. " + validatedFields.error.message };
    }
    
    // Auto-save should always save as a draft
    validatedFields.data.status = 'draft';

    try {
        const { title, slug, category, status, summary, content, image, originalSlug } = validatedFields.data;
        const article: Article = {
            title: `<strong>${title}</strong>`,
            slug, category, status, summary: summary || '', image,
            dataAiHint: 'autosave-draft',
            articleContent: htmlToArticleContent(content),
            publishedDate: new Date().toISOString(),
        };

        const filePath = `src/articles/drafts.json`;
        const currentFileContent = await getFile(filePath);
        let allArticles: Article[] = currentFileContent ? JSON.parse(currentFileContent) : [];

        // Update or add the article
        const articleIndex = allArticles.findIndex(a => a.slug === (originalSlug || slug));
        if (articleIndex > -1) {
            allArticles[articleIndex] = article;
        } else {
            allArticles.unshift(article);
        }
        
        const newContent = JSON.stringify(allArticles, null, 2);
        await saveFile(filePath, newContent, `docs: autosave draft for "${title}"`);

        revalidatePath('/admin/dashboard/edit');
        return { success: true };

    } catch (e: any) {
        return { success: false, error: `Autosave failed: ${e.message}` };
    }
}
