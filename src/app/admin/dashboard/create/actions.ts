
'use server';

import { generateArticleForTopic } from '@/ai/article-generator';
import { type Article, ArticleContentBlock, ArticleSchema as ArticleValidationSchema, ManualArticleSchema as EditSchema } from '@/lib/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { JSDOM } from 'jsdom';
import { categorySlugMap } from '@/lib/constants';
import { getAllArticlesAdmin, saveUpdatedArticles } from '@/lib/articles';

const ArticleFormSchema = z.object({
  topic: z.string().min(1, 'Please enter a topic for the article.'),
  category: z.string().min(1, 'Please select a category.'),
  provider: z.enum(['openrouter', 'sambanova', 'huggingface']),
  model: z.string().min(1, 'Please select an AI model.'),
  style: z.string().min(1, 'Please select a writing style.'),
  mood: z.string().min(1, 'Please select an article mood.'),
  wordCount: z.string().min(1, 'Please select a word count.'),
  imageCount: z.string().min(1, 'Please select the number of images.'),
  openRouterApiKey: z.string().optional(),
  sambaNovaApiKey: z.string().optional(),
  huggingFaceApiKey: z.string().optional(),
});


type GenerateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
};

// This function converts markdown-style text to basic HTML for headings, bold, and italic.
// It's a simplified parser intended for the auto-formatting feature.
function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    // Replace headings (e.g., ## My Heading -> <h2>My Heading</h2>)
    let html = markdown
        .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Replace bold (**text** or __text__) and italic (*text* or _text_)
    html = html
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*?)__/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/_(.*?)_/gim, '<em>$1</em>');
    
    // Convert paragraph line breaks to <p> tags
    html = html.split('\n\n').map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
    
    // A simple fix to avoid wrapping existing block-level elements in <p>
    html = html.replace(/<p><(h[1-6]|ul|ol|li|blockquote|table)/g, '<$1');
    html = html.replace(/<\/(h[1-6]|ul|ol|li|blockquote|table)><\/p>/g, '</$1>');


    return html;
}


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
    sambaNovaApiKey,
    huggingFaceApiKey,
  } = validatedFields.data;

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
      openRouterApiKey,
      sambaNovaApiKey,
      huggingFaceApiKey,
    });

    if (!newArticle) {
      throw new Error('AI failed to generate the article. This could be due to model unavailability, a complex topic, or an incorrect response format. Please try again with a different model or topic, or check your API key credits.');
    }
    
    const articles = await getAllArticlesAdmin(category);
    await saveUpdatedArticles(category, [newArticle, ...articles], `feat: ✨ Add new AI article "${newArticle.title}"`);

    revalidatePath('/');
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
    
    redirect(`/admin/dashboard/edit/${categorySlug}/${newArticle.slug}`);

  } catch (error) {
    console.error('Error in generateArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

function htmlToArticleContent(html: string): ArticleContentBlock[] {
    if (typeof window !== 'undefined' || !html) {
        return [];
    }

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const content: ArticleContentBlock[] = [];
    
    document.body.childNodes.forEach(node => {
        if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // Use the outerHTML to preserve the element itself (e.g., <h2>...</h2>)
            const tagName = element.tagName.toLowerCase() as ArticleContentBlock['type'];

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote', 'table'].includes(tagName)) {
                const outerHTML = element.outerHTML.trim();
                if (outerHTML) {
                    // Store the block with its wrapper tag
                    content.push({ type: tagName, content: outerHTML, alt:'' });
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
  const { title, slug, summary, content, keyTakeaways, conclusion, originalSlug, category, status, image } = validatedFields.data;

  try {
    const articles = await getAllArticlesAdmin(category);
    const articleIndex = articles.findIndex(a => a.slug === originalSlug);

    if (articleIndex === -1) {
      throw new Error("Article not found.");
    }
    
    // Auto-format markdown to HTML on save
    const formattedContent = markdownToHtml(content);
    const newArticleContent = htmlToArticleContent(formattedContent);

    const existingArticle = articles[articleIndex];

    const updatedArticleData: Article = {
      ...existingArticle,
      title,
      slug,
      summary: summary || '',
      status,
      image,
      articleContent: newArticleContent.length > 0 ? newArticleContent : existingArticle.articleContent,
      keyTakeaways: (keyTakeaways || []).map(k => k.value).filter(v => v && v.trim() !== ''),
      conclusion: conclusion,
      publishedDate: new Date().toISOString(),
    };
    
    const finalValidatedArticle = ArticleValidationSchema.safeParse(updatedArticleData);
    if (!finalValidatedArticle.success) {
      console.error("Final validation failed after edit processing:", finalValidatedArticle.error.flatten());
      return { success: false, error: "Failed to process edited article data correctly." };
    }


    articles[articleIndex] = finalValidatedArticle.data;

    await saveUpdatedArticles(category, articles, `feat: ✏️ Edit article "${title}"`);
    
    revalidatePath(`/`);
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/author/kunal-sonpitre');

  } catch (e: any) {
    return { success: false, error: e.message };
  }
  
  redirect('/admin/dashboard/edit');
}

export async function deleteArticleAction(category: string, slug: string) {
    try {
        const articles = await getAllArticlesAdmin(category);
        const updatedArticles = articles.filter(a => a.slug !== slug);
        
        if (articles.length === updatedArticles.length) {
            throw new Error("Article to delete was not found.");
        }

        await saveUpdatedArticles(category, updatedArticles, `feat: 🗑️ Delete article with slug "${slug}"`);

        revalidatePath(`/`);
        const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        revalidatePath(`/${categorySlug}`);
        revalidatePath('/author/kunal-sonpitre');

    } catch (e: any) {
        return { success: false, error: e.message };
    }

    redirect('/admin/dashboard/edit');
}
