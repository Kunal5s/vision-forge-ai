// src/app/api/cron/regenerate-articles/route.ts
'use server';

import 'dotenv/config';
import { generateAndSaveArticles } from '@/lib/articles';

// This file is now a server-side module designed to be executed directly by a script.
// It has been simplified to ONLY regenerate the 'Featured' category for maximum reliability.

const CATEGORY_TO_REGENERATE = 'Featured';

/**
 * Main execution function for the cron job.
 * This will be called directly by the GitHub Actions script.
 */
async function run() {
  try {
    console.log(`CRON job started: Regenerating articles for category: "${CATEGORY_TO_REGENERATE}"...`);

    // Regenerate articles for the 'Featured' category and save them to GitHub
    await generateAndSaveArticles(CATEGORY_TO_REGENERATE);
    
    console.log(`Successfully regenerated articles for ${CATEGORY_TO_REGENERATE} and saved to GitHub.`);

  } catch (error: any) {
    console.error('CRON job failed:', error);
    // Throw the error to ensure the calling script (like a GitHub Action) knows it failed.
    throw error;
  }
}

// This logic allows the file to be executed directly via `tsx` or `node`.
// It checks if the file is the main module being run.
if (require.main === module) {
  console.log('Running regeneration script directly...');
  run().then(() => {
    console.log('Script finished successfully.');
    process.exit(0);
  }).catch((e) => {
    console.error('Script failed with an error:', e);
    process.exit(1);
  });
}

// We keep the named export in case we need to import `run` elsewhere, but the primary use is direct execution.
export { run };
