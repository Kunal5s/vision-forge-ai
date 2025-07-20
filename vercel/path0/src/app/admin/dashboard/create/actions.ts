
'use server';

import { generateArticleForTopic } from '@/ai/article-generator';
import { type Article, ArticleSchema as ArticleValidationSchema, ManualArticleSchema, htmlToArticleContent } from '@/lib/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { getAllArticlesAdmin, saveUpdatedArticles, deleteArticleAction as deleteFromServer, editArticleAction as serverEditArticleAction } from '@/lib/articles';


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
    const allDrafts = await getAllArticlesAdmin('drafts');
    const updatedDrafts = [newArticle, ...allDrafts];
    await saveUpdatedArticles('drafts', updatedDrafts, `feat: ✨ Add new AI article draft "${newArticle.title}"`);

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
  const result = await serverEditArticleAction(data);
  if (result?.error) {
    return { success: false, error: result.error };
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
