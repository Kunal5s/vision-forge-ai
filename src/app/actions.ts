'use server';

import { revalidatePath } from 'next/cache';
import { generateAndSaveArticles } from '@/lib/articles';

// This function is now exclusively for the ON-DEMAND manual trigger button.
// It specifically targets the 'Featured' category.
export async function regenerateFeaturedArticles() {
  try {
    console.log('Regenerating featured articles via on-demand Server Action...');
    
    // The core logic of generating and saving articles to GitHub lives in the articles library.
    // This action specifically regenerates the "Featured" articles.
    await generateAndSaveArticles('Featured');
    
    // Revalidate the homepage to show the newly generated articles immediately.
    revalidatePath('/');
    console.log('Featured articles regenerated and path revalidated.');
    
    return { success: true, message: 'Featured articles have been regenerated!' };
  } catch (error: any) {
    console.error('Failed to regenerate featured articles:', error);
    return { success: false, message: `Error: ${error.message}` };
  }
}
