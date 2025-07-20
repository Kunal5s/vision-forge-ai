
'use server';

import { generateArticleForTopic } from '@/ai/article-generator';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { saveArticle } from '@/lib/articles.server';

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

export async function generateArticleAction(
  data: unknown
): Promise<GenerateArticleResult> {
  const validatedFields = ArticleFormSchema.safeParse(data);

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
    
    // Save the new article, which will handle adding it to the correct file.
    await saveArticle(newArticle, true);

    revalidatePath('/');
    revalidatePath('/admin/dashboard/edit');
    const categorySlug =
      Object.keys(categorySlugMap).find(
        (key) => categorySlugMap[key] === category
      ) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticle.slug}`);
  } catch (error) {
    console.error('Error in generateArticleAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
  
  const validatedData = validatedFields.data;
  // This slug is a fallback/guess. The actual final slug is in `newArticle.slug`
  const slug = validatedData.topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  const categorySlug =
      Object.keys(categorySlugMap).find(
        (key) => categorySlugMap[key] === validatedData.category
      ) || validatedData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // The redirect now points to the new edit page for the article
  redirect(`/admin/dashboard/edit/${categorySlug}/${slug}`);
}
