
'use server';

import { revalidatePath } from 'next/cache';
import { getArticles } from '@/lib/articles';

// These topics need to be defined somewhere accessible.
const featuredTopics = [
    'The Impact of 5G Technology on society',
    'Beginner\'s Guide to Investing in the stock market',
    'The creative process of Digital Art',
    'Exploring Ancient Civilizations with Modern AI technology',
];

export async function regenerateFeaturedArticles() {
  try {
    console.log('Regenerating featured articles...');
    await getArticles('Featured', featuredTopics, { forceRegenerate: true });
    revalidatePath('/');
    console.log('Featured articles regenerated and path revalidated.');
    return { success: true, message: 'Featured articles have been regenerated!' };
  } catch (error: any) {
    console.error('Failed to regenerate featured articles:', error);
    return { success: false, message: `Error: ${error.message}` };
  }
}
