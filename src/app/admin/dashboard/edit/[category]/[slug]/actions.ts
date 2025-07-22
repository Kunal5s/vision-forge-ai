
'use server';

import { revalidatePath } from 'next/navigation';
import { type Article, type ArticleContentBlock } from '@/lib/articles';
import { ManualArticleSchema, type ManualArticleFormData } from '@/lib/types';
import { JSDOM } from 'jsdom';
import { OpenAI } from 'openai';
import { OPENROUTER_MODELS } from '@/lib/constants';

// TODO: Replace with Xata functions to save/update/delete articles
async function saveArticleToDb(article: Article, isNew: boolean): Promise<void> {
  console.log("Simulating save to Xata:", article.title, "New:", isNew);
  // This is where you would put your `xata.db.articles.create` or `xata.db.articles.update` call.
}

async function deleteArticleFromDb(slug: string): Promise<void> {
    console.log("Simulating delete from Xata:", slug);
}

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

    const isNew = !originalSlug;
    await saveArticleToDb(article, isNew);
    
    // Revalidate relevant paths
    revalidatePath('/admin/dashboard/edit');
    revalidatePath(`/blog?category=${category}`);
    if (status === 'published') {
        revalidatePath(`/${category}/${slug}`);
        if(originalSlug && originalSlug !== slug) {
            revalidatePath(`/${category}/${originalSlug}`);
        }
    }
    
  } catch (e: any) {
    console.error("Failed to edit/save article:", e);
    return { success: false, error: `Server error: ${e.message}` };
  }
}

export async function deleteArticleAction(category: string, slug: string, isDraft: boolean) {
    try {
        await deleteArticleFromDb(slug);

        revalidatePath('/admin/dashboard/edit');
        if (!isDraft) {
            const categorySlug = category.toLowerCase().replace(/ /g, '-');
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
            imgDiv.className = 'my-8';
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
        const { title, slug, category, status, summary, content, image } = validatedFields.data;
        const article: Article = {
            title: `<strong>${title}</strong>`,
            slug, category, status, summary: summary || '', image,
            dataAiHint: 'autosave-draft',
            articleContent: htmlToArticleContent(content),
            publishedDate: new Date().toISOString(),
        };

        const isNew = !validatedFields.data.originalSlug;
        await saveArticleToDb(article, isNew);
        revalidatePath('/admin/dashboard/edit');
        return { success: true };

    } catch (e: any) {
        return { success: false, error: `Autosave failed: ${e.message}` };
    }
}
