
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateArticleForTopic } from '@/ai/article-generator';
import { categorySlugMap } from '@/lib/constants';
import { saveArticle } from '@/lib/articles';

// Schema for the form on the create page. It's different from ManualArticleSchema
// because it includes AI provider details and doesn't have existing content.
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

// Revalidate relevant paths after an article is changed
function revalidateArticlePaths(slug: string, categoryName: string) {
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === categoryName) || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath('/');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/admin/dashboard/edit');
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
    
    // Save the new article, which will handle adding it to the correct file.
    await saveArticle(newArticle, true);

    const categorySlug =
      Object.keys(categorySlugMap).find(
        (key) => categorySlugMap[key] === category
      ) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
    revalidateArticlePaths(newArticle.slug, newArticle.category);

    // The redirect now points to the new edit page for the article
    redirect(`/admin/dashboard/edit/${categorySlug}/${newArticle.slug}`);

  } catch (error) {
    console.error('Error in generateArticleAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}
