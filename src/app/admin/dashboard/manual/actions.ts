
'use server';

import { type Article, ArticleSchema as ArticleValidationSchema, ArticleContentBlock, ManualArticleSchema } from '@/lib/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveUpdatedArticles, getAllArticlesAdmin, deleteArticleAction } from '@/lib/articles'; // Import the universal save function
import { redirect } from 'next/navigation';
import { JSDOM } from 'jsdom';
import { categorySlugMap } from '@/lib/constants';


function markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    let html = markdown
        .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*?)__/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/_(.*?)_/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
        .replace(/^\s*-\s+/gim, '<li>')
        .replace(/^\s*\d+\.\s+/gim, '<li>')
        .replace(/\n/g, '<br>');

    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>').replace(/<\/ul>\s*<ul>/g, ''); 

    return html;
}

function htmlToArticleContent(html: string): ArticleContentBlock[] {
  if (typeof window !== 'undefined') {
    return []; 
  }
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const content: ArticleContentBlock[] = [];
    document.body.childNodes.forEach(node => {
      if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote'].includes(tagName)) {
           const innerHTML = element.innerHTML.trim();
           if (innerHTML) {
             content.push({ type: 'p', content: element.outerHTML, alt: '' }); // Save wrapper tag
           }
        } else if (tagName === 'img' && element.hasAttribute('src')) {
           content.push({ type: 'img', content: element.getAttribute('src')!, alt: element.getAttribute('alt') || '' });
        } else if (tagName === 'table') {
           content.push({ type: 'p', content: element.outerHTML, alt: '' });
        }
      }
    });
    return content.filter(block => (block.content && block.content.trim() !== '') || block.type === 'img');
}

export async function addImagesToArticleAction(content: string, imageCount: number = 5): Promise<{success: boolean, content?: string, error?: string}> {
    try {
        const dom = new JSDOM(`<body>${content}</body>`);
        const document = dom.window.document;
        const insertionPoints = Array.from(document.querySelectorAll('h2, h3, p'));

        document.querySelectorAll('img[src*="pollinations.ai"]').forEach(img => img.remove());
        
        const validInsertionPoints = insertionPoints.filter(h => h.textContent && h.textContent.trim().split(' ').length > 5);
        
        const numImagesToAdd = Math.min(imageCount, validInsertionPoints.length);
        if (numImagesToAdd === 0) {
            return { success: false, error: "No suitable locations found to add images. Try adding more headings or longer paragraphs." };
        }
        
        const step = Math.max(1, Math.floor(validInsertionPoints.length / numImagesToAdd));

        for (let i = 0; i < numImagesToAdd; i++) {
            const pointIndex = Math.min(i * step, validInsertionPoints.length - 1);
            const insertionPoint = validInsertionPoints[pointIndex];
            const topic = insertionPoint.textContent?.trim() || "relevant photography";

            if (topic) {
                const seed = Math.floor(Math.random() * 1_000_000);
                const finalPrompt = `${topic.substring(0, 100)}, relevant photography, high detail, cinematic`;
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=800&height=450&seed=${seed}&nologo=true`;

                const img = document.createElement('img');
                img.src = pollinationsUrl;
                img.alt = topic;
                
                insertionPoint.parentNode?.insertBefore(img, insertionPoint.nextSibling);
            }
        }
        
        return { success: true, content: document.body.innerHTML };
    } catch (e: any) {
        console.error("Failed to add images to article content on server:", e);
        return { success: false, error: "Could not process article content to add images." };
    }
}

type CreateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
  slug?: string;
  category?: string;
};

// Main server action for manual creation
export async function createManualArticleAction(data: unknown): Promise<CreateArticleResult> {
  const validatedFields = ManualArticleSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten());
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const formattedError = Object.entries(errorMessages).map(([field, errors]) => `${field}: ${errors?.join(', ')}`).join('; ');
    return { success: false, error: formattedError || 'Invalid input data.' };
  }
  
  const { title, slug, category, status, summary, content, keyTakeaways, conclusion, image } = validatedFields.data;

  try {
    const formattedContentHtml = content; // Assuming content is already HTML from RichTextEditor
    const articleContent = htmlToArticleContent(formattedContentHtml);

    const newArticleData: Article = {
      title,
      slug,
      category,
      status,
      image,
      dataAiHint: "manual content upload",
      publishedDate: new Date().toISOString(),
      summary: summary || '',
      articleContent,
      keyTakeaways: keyTakeaways ? keyTakeaways.map(k => k.value).filter(v => v && v.trim() !== '') : [],
      conclusion: conclusion || '',
    };

    const finalValidatedArticle = ArticleValidationSchema.safeParse(newArticleData);

    if (!finalValidatedArticle.success) {
      console.error("Final Validation Failed after processing:", finalValidatedArticle.error.flatten());
      return { success: false, error: "Failed to process article data correctly." };
    }
    
    // Save as draft or publish directly
    if (status === 'published') {
        const existingArticles = await getAllArticlesAdmin(category);
        const updatedArticles = [finalValidatedArticle.data, ...existingArticles];
        await saveUpdatedArticles(category, updatedArticles, `feat: ✨ Add new manual article "${newArticleData.title}"`);
        // If there was a draft for this slug, delete it
        await deleteArticleAction(category, slug, true);
    } else {
        // Save to drafts folder
        await saveUpdatedArticles('drafts', [finalValidatedArticle.data], `docs: 📝 Save manual draft "${newArticleData.title}"`, `${slug}.json`);
    }

    revalidatePath('/');
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticleData.slug}`);
    revalidatePath('/admin/dashboard/edit');
    
    // Redirect to the edit page after creation
    return { success: true, title: newArticleData.title, slug, category: categorySlug };

  } catch (error) {
    console.error('Error in createManualArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}
