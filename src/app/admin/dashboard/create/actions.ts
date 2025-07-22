
'use server';

import { redirect } from 'next/navigation';
import { generateArticleForTopic } from '@/ai/article-generator';
import { categorySlugMap } from '@/lib/constants';
import * as z from 'zod';
import type { Article } from '@/lib/articles';
import { getFile, saveFile } from '@/lib/github';

const GenerateArticleFormSchema = z.object({
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

async function saveArticle(article: Article): Promise<{ success: boolean; error?: string }> {
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === article.category) || article.category.toLowerCase();
    const filePath = `src/articles/${categorySlug}.json`;
    
    try {
        let existingArticles: Article[] = [];
        const currentContent = await getFile(filePath);

        if (currentContent) {
            existingArticles = JSON.parse(currentContent);
        }

        // Add the new article and ensure no duplicates by slug
        const newArticles = [article, ...existingArticles.filter(a => a.slug !== article.slug)];
        const newContent = JSON.stringify(newArticles, null, 2);

        await saveFile(filePath, newContent, `feat: add new article "${article.title}"`);

        return { success: true };

    } catch (error: any) {
        console.error(`Failed to save article to GitHub file: ${filePath}`, error);
        return { success: false, error: error.message };
    }
}


export async function generateArticleAction(
  data: unknown
): Promise<GenerateArticleResult> {
  const validatedFields = GenerateArticleFormSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten());
    return {
      success: false,
      error: 'Invalid input data for article generation.',
    };
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
      throw new Error(
        'AI failed to generate the article. This could be due to model unavailability, a complex topic, or an incorrect response format. Please try again with a different model or topic, or check your API key credits.'
      );
    }
    
    // Save to GitHub
    await saveArticle(newArticle);

    const categorySlug =
      Object.keys(categorySlugMap).find(
        (key) => categorySlugMap[key] === category
      ) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
    // Revalidate paths after saving to ensure content is fresh
    revalidatePath('/admin/dashboard/edit');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/blog`);
      
    redirect(`/admin/dashboard/edit/${categorySlug}/${newArticle.slug}`);

  } catch (error) {
    console.error('Error in generateArticleAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}
