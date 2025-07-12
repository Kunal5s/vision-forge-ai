// This script is designed to be run by a CRON job.
// It regenerates content for two randomly selected categories.
// This ensures the site's content stays fresh over time without being too resource-intensive.

import { generateAndSaveArticles } from '../lib/articles';
import { categorySlugMap } from '../lib/constants';

// All categories are potential candidates for regeneration
const ALL_CATEGORIES = Object.values(categorySlugMap);

function selectTwoRandomCategories(categories: string[]): string[] {
  // Create a shuffled copy of the array
  const shuffled = [...categories].sort(() => 0.5 - Math.random());
  // Return the first two elements
  return shuffled.slice(0, 2);
}

async function regenerate() {
  console.log('CRON JOB: Starting scheduled regeneration for two random categories...');
  
  const categoriesToUpdate = selectTwoRandomCategories(ALL_CATEGORIES);
  console.log(`Selected categories for this run: ${categoriesToUpdate.join(', ')}`);

  for (const category of categoriesToUpdate) {
    try {
      console.log(`\n----- Regenerating articles for category: "${category}" -----`);
      await generateAndSaveArticles(category);
      console.log(`----- Successfully finished regeneration for category: "${category}" -----`);
    } catch (error) {
      console.error(`Failed to regenerate articles for category "${category}". Error:`, error);
    }
  }
  
  console.log('\n✅ CRON JOB: Scheduled regeneration process finished.');
}

regenerate();
