// This script is for one-time manual generation of all articles.
// It is not part of the automatic CRON job.
// To run: `npm run generate-articles`
// Note: This is a long-running process and may take a significant amount of time.

import { generateAndSaveArticles } from '../lib/articles';
import { categorySlugMap } from '../lib/constants';

const ALL_CATEGORIES = Object.values(categorySlugMap);

async function generateAll() {
  console.log('Starting one-time generation for ALL categories...');
  
  for (const category of ALL_CATEGORIES) {
    try {
      console.log(`\n----- Generating articles for category: "${category}" -----`);
      // The generateAndSaveArticles function will now handle everything:
      // fetching topics, generating content, and saving to JSON.
      await generateAndSaveArticles(category);
      console.log(`----- Successfully finished category: "${category}" -----`);
    } catch (error) {
      console.error(`Failed to generate articles for category "${category}". Error:`, error);
      // We continue to the next category even if one fails.
    }
  }
  
  console.log('\n✅ All-category article generation process finished.');
}

generateAll();
