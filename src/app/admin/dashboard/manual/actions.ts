
'use server';

import { getArticles, Article } from '@/lib/articles';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveUpdatedArticles } from '../create/actions'; // Import the universal save function
import { redirect } from 'next/navigation';
import parse, { Element } from 'html-react-parser';

// Helper function to parse HTML into article content blocks
function parseHtmlToContent(html: string): Article['articleContent'] {
  const content: Article['articleContent'] = [];
  const parsed = parse(html, {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.attribs) {
        const { tagName, children } = domNode;
        const textContent = (children[0] as any)?.data || '';
        
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName)) {
          // Simplistic text extraction; a more robust solution would recursively get text.
           const extractText = (nodes: any[]): string => {
                return nodes.map(node => {
                    if (node.type === 'text') return node.data;
                    if (node.children) return extractText(node.children);
                    return '';
                }).join('');
            };
          content.push({ type: tagName as any, content: extractText(domNode.children) });
        } else if (tagName === 'img' && domNode.attribs.src) {
           content.push({ type: 'img', content: domNode.attribs.src, alt: domNode.attribs.alt || '' });
        }
      }
    }
  });

  // Filter out empty paragraphs that might result from parsing
  return content.filter(block => block.content.trim() !== '' || block.type === 'img');
}


const ManualArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  slug: z.string().min(5, 'Slug must be at least 5 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
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
    const errorMessage = validatedFields.error.flatten().fieldErrors;
    return { success: false, error: JSON.stringify(errorMessage) || 'Invalid input data.' };
  }
  
  const { title, slug, category, content, keyTakeaways, conclusion, image } = validatedFields.data;

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
      articleContent,
      keyTakeaways: keyTakeaways ? keyTakeaways.map(k => k.value).filter(v => v.trim() !== '') : [],
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
    
    redirect('/admin/dashboard/edit');

  } catch (error) {
    console.error('Error in createManualArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}
