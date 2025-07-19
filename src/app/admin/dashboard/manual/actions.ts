

'use server';

import { getAllArticlesAdmin, Article } from '@/lib/articles';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveUpdatedArticles } from '../create/actions'; // Import the universal save function
import { redirect } from 'next/navigation';
import { JSDOM } from 'jsdom';

// Function to convert markdown-like text to basic HTML
function markdownToHtml(text: string): string {
  // First, clean up stray HTML tags that might interfere
  let cleanText = text.replace(/<\/?(p|h[1-6]|table|tr|td|th|tbody|thead)>/g, '');

  let html = cleanText
    .split('\n')
    .map(line => {
      line = line.trim();
      if (line.startsWith('###### ')) return `<h6>${line.substring(7)}</h6>`;
      if (line.startsWith('##### ')) return `<h5>${line.substring(6)}</h5>`;
      if (line.startsWith('#### ')) return `<h4>${line.substring(5)}</h4>`;
      if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
      // Wrap non-heading lines in <p> tags only if they contain text
      if (line.length > 0) return `<p>${line}</p>`;
      return '';
    })
    .join('');

  return html;
}

// Helper function to parse HTML into article content blocks, now with formatting
function parseAndFormatContent(html: string): Article['articleContent'] {
  const formattedHtml = markdownToHtml(html);
  const dom = new JSDOM(formattedHtml);
  const document = dom.window.document;
  const content: Article['articleContent'] = [];
  
  // Iterate over direct children of the body
  document.body.childNodes.forEach(node => {
    if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName)) {
        const textContent = element.innerHTML.trim(); // Use innerHTML to preserve inline tags like <strong>
        if (textContent) {
          content.push({ type: tagName as any, content: textContent });
        }
      } else if (tagName === 'img' && element.hasAttribute('src')) {
        content.push({ type: 'img', content: element.getAttribute('src')!, alt: element.getAttribute('alt') || '' });
      } else if (tagName === 'table') {
        content.push({ type: 'p', content: element.outerHTML });
      }
    }
  });
  
  // Filter out empty blocks that might result from parsing
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
    const articleContent = parseAndFormatContent(content);
    
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
