
'use server';

import { generateArticleForTopic } from '@/ai/article-generator';
import { type Article, ArticleSchema as ArticleValidationSchema } from '@/lib/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { getAllArticlesAdmin, saveUpdatedArticles, getArticleForEdit, deleteArticleAction as deleteFromServer } from '@/lib/articles';
import { htmlToArticleContent } from '../manual/actions';


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
    
    // Since this is a newly generated article, it starts as a draft.
    // We save it to the drafts folder. It will be moved on publish.
    await saveUpdatedArticles('drafts', [newArticle], `feat: ✨ Add new AI article draft "${newArticle.title}"`, `${newArticle.slug}.json`);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/edit');
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
    
    redirect(`/admin/dashboard/edit/${categorySlug}/${newArticle.slug}`);

  } catch (error) {
    console.error('Error in generateArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

export async function editArticleAction(data: unknown) {
  const validatedFields = ManualArticleSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid data." };
  }
  const { title, slug, summary, content, keyTakeaways, conclusion, originalSlug, category, status, image } = validatedFields.data;

  try {
    const existingArticle = await getArticleForEdit(category, originalSlug);
    if (!existingArticle) {
        throw new Error("Article to edit was not found.");
    }
    
    const newArticleContent = htmlToArticleContent(content);

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
      publishedDate: status === 'published' ? (existingArticle.publishedDate || new Date().toISOString()) : new Date().toISOString(),
    };
    
    const finalValidatedArticle = ArticleValidationSchema.safeParse(updatedArticleData);
    if (!finalValidatedArticle.success) {
      console.error("Final validation failed after edit processing:", finalValidatedArticle.error.flatten());
      return { success: false, error: "Failed to process edited article data correctly." };
    }
    
    // If publishing, add to category file and delete from drafts.
    // If just saving draft, update the draft file.
    if (status === 'published') {
        const publishedArticles = await getAllArticlesAdmin(category);
        const articleIndex = publishedArticles.findIndex(a => a.slug === originalSlug);
        
        if (articleIndex > -1) {
            publishedArticles[articleIndex] = finalValidatedArticle.data;
        } else {
            publishedArticles.unshift(finalValidatedArticle.data);
        }
        
        await saveUpdatedArticles(category, publishedArticles, `feat: ✏️ Publish article "${title}"`);
        // Delete from drafts
        await deleteFromServer(category, originalSlug, true);

    } else { // Saving as draft
        await saveUpdatedArticles('drafts', [finalValidatedArticle.data], `docs: 📝 Autosave draft for "${title}"`, `${slug}.json`);
    }

    revalidatePath(`/`);
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/admin/dashboard/edit');

  } catch (e: any) {
    return { success: false, error: e.message };
  }
  
  redirect('/admin/dashboard/edit');
}

export async function deleteArticleAction(category: string, slug: string, isDraft: boolean = true) {
    const result = await deleteFromServer(category, slug, isDraft);
     if (result?.error) {
        return { success: false, error: result.error };
    }
    
    if(!isDraft) {
        redirect('/admin/dashboard/edit');
    }
    return { success: true };
}
