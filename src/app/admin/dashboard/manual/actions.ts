
'use server';

import { getArticles, Article } from '@/lib/articles';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveUpdatedArticles } from '../create/actions'; // Import the universal save function
import { redirect } from 'next/navigation';
import { JSDOM } from 'jsdom';

// Helper function to parse HTML into article content blocks
function parseHtmlToContent(html: string): Article['articleContent'] {
  const dom = new JSDOM(html);
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
        // Prioritize H2 headings for image placement
        let headings = Array.from(document.querySelectorAll('h2, h3'));

        // If not enough headings, add paragraphs to the list of potential insertion points
        if (headings.length < imageCount) {
            const paragraphs = Array.from(document.querySelectorAll('p'));
            headings = [...headings, ...paragraphs];
        }

        // Remove existing AI-generated images to avoid duplicates on re-runs
        document.querySelectorAll('img[src*="pollinations.ai"]').forEach(img => img.remove());
        
        // Filter out very short headings/paragraphs and get the best candidates
        const validHeadings = headings.filter(h => h.textContent && h.textContent.trim().split(' ').length > 3);
        
        // Distribute images evenly among the best candidate headings
        const numImagesToAdd = Math.min(imageCount, validHeadings.length);
        if (numImagesToAdd === 0) {
            return { success: false, error: "No suitable headings found in the article to add images after. Try adding more H2 or H3 headings." };
        }
        
        const step = Math.floor(validHeadings.length / numImagesToAdd);

        for (let i = 0; i < numImagesToAdd; i++) {
            // Pick headings at even intervals
            const headingIndex = Math.min(i * step, validHeadings.length - 1);
            const heading = validHeadings[headingIndex];
            const topic = heading.textContent?.trim();

            if (topic) {
                const seed = Math.floor(Math.random() * 1_000_000);
                const finalPrompt = `${topic}, relevant photography, high detail, cinematic`;
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=800&height=450&seed=${seed}&nologo=true`;

                const img = document.createElement('img');
                img.src = pollinationsUrl;
                img.alt = topic;
                img.style.display = 'block';
                img.style.margin = '2rem auto';
                img.style.borderRadius = '6px';
                
                // Insert the image after the heading element
                heading.parentNode?.insertBefore(img, heading.nextSibling);
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
  
  const { title, slug, category, summary, content, keyTakeaways, conclusion, image } = validatedFields.data;

  try {
    const articleContent = parseHtmlToContent(content);
    
    // Create a new article object
    const newArticle: Article = {
      title,
      slug,
      category,
      image,
      dataAiHint: "manual content upload",
      publishedDate: new Date().toISOString(),
      summary: summary || '',
      articleContent,
      keyTakeaways: keyTakeaways ? keyTakeaways.map(k => k.value).filter(v => v && v.trim() !== '') : [],
      conclusion,
    };
    
    const existingArticles = await getArticles(category);
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
