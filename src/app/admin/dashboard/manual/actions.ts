
'use server';

import { getArticles, Article, ArticleContentBlock } from '@/lib/articles';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveUpdatedArticles } from '../create/actions'; // Import the universal save function
import { redirect } from 'next/navigation';

const ManualArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  slug: z.string().min(5, 'Slug must be at least 5 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  content: z.string().min(50, 'Content must be at least 50 characters long.'),
  keyTakeaways: z.string().optional(), // Make optional
  conclusion: z.string().min(20, 'Conclusion must be at least 20 characters long.'),
  image: z.string().url('A valid image URL is required.'),
});

type CreateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
};

// Helper function to parse Markdown into article content blocks
function parseMarkdownToContent(markdown: string): ArticleContentBlock[] {
  const lines = markdown.split(/\n\s*\n/); // Split by blank lines
  return lines.map(line => {
    line = line.trim();
    if (line.startsWith('###### ')) return { type: 'h6', content: line.substring(7) };
    if (line.startsWith('##### ')) return { type: 'h5', content: line.substring(6) };
    if (line.startsWith('#### ')) return { type: 'h4', content: line.substring(5) };
    if (line.startsWith('### ')) return { type: 'h3', content: line.substring(4) };
    if (line.startsWith('## ')) return { type: 'h2', content: line.substring(3) };
    if (line.length > 0) return { type: 'p', content: line };
    return { type: 'p', content: '' }; // Should be filtered out
  }).filter(block => block.content.length > 0);
}


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
    const articleContent = parseMarkdownToContent(content);
    
    // Create a new article object
    const newArticle: Article = {
      title,
      slug,
      category,
      articleContent,
      keyTakeaways: keyTakeaways ? keyTakeaways.split(',').map(k => k.trim()) : [],
      conclusion,
      image: image || `https://placehold.co/600x400.png`,
      dataAiHint: "manual article photography",
      publishedDate: new Date().toISOString(),
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
    
    // Return success but let redirection handle the UI change
    return { success: true, title: newArticle.title };

  } catch (error) {
    console.error('Error in createManualArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
  
  // Redirect after successful save and revalidation
  redirect('/admin/dashboard/edit');
}
