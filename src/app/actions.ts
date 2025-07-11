
'use server';

import { revalidatePath } from 'next/cache';
import { generateAndSaveArticles } from '@/lib/articles';
import { featuredTopics } from '@/lib/constants';

// This function is now exclusively for the CRON job.
export async function regenerateFeaturedArticles() {
  try {
    console.log('Regenerating featured articles via CRON job...');
    
    // The core logic of generating and saving articles to GitHub lives in the articles library.
    // This is called by the CRON job.
    await generateAndSaveArticles('Featured', featuredTopics);
    
    // Revalidate the homepage to show the newly generated articles after the CRON-triggered deployment.
    revalidatePath('/');
    console.log('Featured articles regenerated and path revalidated.');
    
    return { success: true, message: 'Featured articles have been regenerated!' };
  } catch (error: any) {
    console.error('Failed to regenerate featured articles:', error);
    return { success: false, message: `Error: ${error.message}` };
  }
}
