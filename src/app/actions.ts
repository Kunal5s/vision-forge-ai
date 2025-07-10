
'use server';

import { revalidatePath } from 'next/cache';
import { generateAndSaveArticles } from '@/lib/articles';
import { featuredTopics } from '@/lib/constants';

export async function regenerateFeaturedArticles() {
  try {
    console.log('Regenerating featured articles...');
    await generateAndSaveArticles('Featured', featuredTopics);
    revalidatePath('/');
    console.log('Featured articles regenerated and path revalidated.');
    return { success: true, message: 'Featured articles have been regenerated!' };
  } catch (error: any) {
    console.error('Failed to regenerate featured articles:', error);
    return { success: false, message: `Error: ${error.message}` };
  }
}
