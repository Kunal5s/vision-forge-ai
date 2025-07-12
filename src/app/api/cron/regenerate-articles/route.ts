// src/app/api/cron/regenerate-articles/route.ts
'use server';

import 'dotenv/config';
import { generateAndSaveArticles } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { getContent, saveContent } from '@/lib/github';

// This file is now a server-side module designed to be executed directly by a script, not as a POST endpoint.

const STATE_FILE_PATH = 'src/lib/regeneration-state.json';
// The order in which categories will be updated. 'featured' is intentionally left out
// to keep its content more stable, while other categories rotate frequently.
const CATEGORY_ROTATION = Object.keys(categorySlugMap).filter(slug => slug !== 'featured');

interface RegenerationState {
  lastUpdatedCategoryIndex: number;
}

// This function now gets the NEXT category to update.
async function getNextCategoryForUpdate(): Promise<string | null> {
    let state: RegenerationState;
    try {
        const file = await getContent(STATE_FILE_PATH);
        if (file) {
            state = JSON.parse(file.content);
        } else {
            // If file doesn't exist, start from the beginning
            state = { lastUpdatedCategoryIndex: -1 };
        }
    } catch (error) {
        console.warn(`Could not read state file, starting from scratch. Error: ${error}`);
        state = { lastUpdatedCategoryIndex: -1 };
    }

    // Move to the next index in the rotation
    const nextIndex = (state.lastUpdatedCategoryIndex + 1) % CATEGORY_ROTATION.length;
    const nextCategorySlug = CATEGORY_ROTATION[nextIndex];
    const nextCategoryName = categorySlugMap[nextCategorySlug];
    
    // Save the new state for the next run
    const newState: RegenerationState = { lastUpdatedCategoryIndex: nextIndex };
    const stateFile = await getContent(STATE_FILE_PATH);
    await saveContent(
        STATE_FILE_PATH,
        JSON.stringify(newState, null, 2),
        `chore: update regeneration state to index ${nextIndex}`,
        stateFile?.sha
    );
    
    return nextCategoryName || null;
}

/**
 * Main execution function for the cron job.
 * This will be called directly by the GitHub Actions script.
 */
async function run() {
  try {
    const categoryToUpdate = await getNextCategoryForUpdate();
    if (!categoryToUpdate) {
        console.log('CRON job ran, but no category was scheduled for update.');
        return;
    }

    console.log(`CRON job started: Regenerating articles for category: "${categoryToUpdate}"...`);

    // Regenerate articles for the determined category and save them to GitHub
    await generateAndSaveArticles(categoryToUpdate);
    console.log(`Successfully regenerated articles for ${categoryToUpdate} and saved to GitHub.`);

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
