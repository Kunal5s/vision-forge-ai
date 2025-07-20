

'use server';

import { getAllArticlesAdmin, Article } from '@/lib/articles';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveUpdatedArticles } from '../create/actions'; // Import the universal save function
import { redirect } from 'next/navigation';
import { JSDOM } from 'jsdom';

function markdownToHtml(markdown: string): string {
    let html = markdown
        .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*)__/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/_(.*)_/gim, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
}

// Helper function to parse HTML into article content blocks, now with formatting
function htmlToArticleContent(html: string): Article['articleContent'] {
    // Process markdown-style headings first
    const processedHtml = markdownToHtml(html);

  if (typeof window !== 'undefined') {
    return []; 
  }
    // Server-side parsing
    const dom = new JSDOM(processedHtml);
    const document = dom.window.document;
    const content: Article['articleContent'] = [];
    document.body.childNodes.forEach(node => {
      if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName)) {
           const innerHTML = element.innerHTML.trim();
           if (innerHTML) {
             content.push({ type: tagName as any, content: innerHTML });
           }
        } else if (tagName === 'img' && element.hasAttribute('src')) {
           content.push({ type: 'img', content: element.getAttribute('src')!, alt: element.getAttribute('alt') || '' });
        } else if (tagName === 'table') {
           content.push({ type: 'p', content: element.outerHTML });
        }
      }
    });
    return content.filter(block => (block.content && block.content.trim() !== '') || block.type === 'img');
}

export async function addImagesToArticleAction(content: string, imageCount: number = 5): Promise<{success: boolean, content?: string, error?: string}> {
    try {
        const dom = new JSDOM(`<body>${content}</body>`);
        const document = dom.window.document;

        // Find all potential insertion points (after H2, H3, or P tags)
        const insertionPoints = Array.from(document.querySelectorAll('h2, h3, p'));

        // Remove existing AI-generated images to avoid duplicates on re-runs
        document.querySelectorAll('img[src*="pollinations.ai"]').forEach(img => img.remove());
        
        // Filter out very short paragraphs and get the best candidates
        const validInsertionPoints = insertionPoints.filter(h => h.textContent && h.textContent.trim().split(' ').length > 5);
        
        const numImagesToAdd = Math.min(imageCount, validInsertionPoints.length);
        if (numImagesToAdd === 0) {
            return { success: false, error: "No suitable locations found in the article to add images. Try adding more headings or longer paragraphs." };
        }
        
        // Distribute images evenly among the best candidate locations
        const step = Math.max(1, Math.floor(validInsertionPoints.length / numImagesToAdd));

        for (let i = 0; i < numImagesToAdd; i++) {
            const pointIndex = Math.min(i * step, validInsertionPoints.length - 1);
            const insertionPoint = validInsertionPoints[pointIndex];
            const topic = insertionPoint.textContent?.trim() || "relevant photography";

            if (topic) {
                const seed = Math.floor(Math.random() * 1_000_000);
                // Create a more descriptive prompt for better images
                const finalPrompt = `${topic.substring(0, 100)}, relevant photography, high detail, cinematic`;
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=800&height=450&seed=${seed}&nologo=true`;

                const img = document.createElement('img');
                img.src = pollinationsUrl;
                img.alt = topic;
                
                // Insert the image after the chosen insertion point
                insertionPoint.parentNode?.insertBefore(img, insertionPoint.nextSibling);
            }
        }
        
        return { success: true, content: document.body.innerHTML };
    } catch (e: any) {
        console.error("Failed to add images to article content on server:", e);
        return { success: false, error: "Could not process article content to add images." };
    }
}


const ManualArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  slug: z.string().min(5, 'Slug must be at least 5 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  status: z.enum(['published', 'draft']),
  summary: z.string().optional(),
  content: z.string().min(50, 'Content must be at least 50 characters long.'),
  keyTakeaways: z.array(z.object({ value: z.string() })).optional(),
  conclusion: z.string().min(20, 'Conclusion must be at least 20 characters long.'),
  image: z.string().url('A valid image URL is required.'),
});

type CreateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
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
    const articleContent = htmlToArticleContent(content);
    
    // Create a new article object
    const newArticle: Article = {
      title,
      slug,
      category,
      status, // Save the status
      image,
      dataAiHint: "manual content upload",
      publishedDate: new Date().toISOString(),
      summary: summary || '',
      articleContent,
      keyTakeaways: keyTakeaways ? keyTakeaways.map(k => k.value).filter(v => v && v.trim() !== '') : [],
      conclusion,
    };
    
    const existingArticles = await getAllArticlesAdmin(category);
    const updatedArticles = [newArticle, ...existingArticles];
    
    // Save the article to GitHub
    await saveUpdatedArticles(category, updatedArticles, `feat: ✨ Add new manual article "${newArticle.title}"`);

    // Revalidate paths to show new content immediately
    revalidatePath('/');
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
    
  } catch (error) {
    console.error('Error in createManualArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
  
  redirect('/admin/dashboard/edit');
}
