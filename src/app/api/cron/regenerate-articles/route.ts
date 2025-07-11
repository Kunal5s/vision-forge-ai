// src/app/api/cron/regenerate-articles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateAndSaveArticles } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { getContent, saveContent } from '@/lib/github';

export const dynamic = 'force-dynamic';

const STATE_FILE_PATH = 'src/lib/regeneration-state.json';
// We will update two categories per CRON run to ensure more freshness across the site.
const CATEGORIES_PER_RUN = 2; 
// The order in which categories will be updated. 'Featured' is intentionally left out
// as it can be a manual or special case, keeping other content evergreen.
const CATEGORY_ROTATION = Object.keys(categorySlugMap).filter(slug => slug !== 'featured');

interface RegenerationState {
  lastUpdatedCategoryIndex: number;
}

// This function now gets the NEXT TWO categories to update.
async function getNextCategoriesForUpdate(): Promise<string[]> {
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

    const categoriesToUpdate: string[] = [];
    let currentIndex = state.lastUpdatedCategoryIndex;

    for (let i = 0; i < CATEGORIES_PER_RUN; i++) {
        currentIndex = (currentIndex + 1) % CATEGORY_ROTATION.length;
        const nextCategorySlug = CATEGORY_ROTATION[currentIndex];
        // Convert slug back to the proper category name (e.g., 'prompts' -> 'Prompts')
        const nextCategoryName = categorySlugMap[nextCategorySlug];
        if (nextCategoryName) {
            categoriesToUpdate.push(nextCategoryName);
        }
    }
    
    // Save the new state for the next run
    const newState: RegenerationState = { lastUpdatedCategoryIndex: currentIndex };
    const stateFile = await getContent(STATE_FILE_PATH);
    await saveContent(
        STATE_FILE_PATH,
        JSON.stringify(newState, null, 2),
        `chore: update regeneration state to index ${currentIndex}`,
        stateFile?.sha
    );
    
    return categoriesToUpdate;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categoriesToUpdate = await getNextCategoriesForUpdate();
    if (categoriesToUpdate.length === 0) {
        console.log('CRON job ran, but no categories were scheduled for update.');
        return NextResponse.json({ success: true, message: 'No categories scheduled for update.' });
    }

    console.log(`CRON job started: Regenerating articles for categories: "${categoriesToUpdate.join(', ')}"...`);

    // Regenerate articles for the determined categories and save them to GitHub
    const generationPromises = categoriesToUpdate.map(category => 
        generateAndSaveArticles(category).catch(e => {
            console.error(`Failed to generate articles for category: ${category}`, e);
            return null; // Don't let one failure stop the whole process
        })
    );
    await Promise.all(generationPromises);
    console.log(`Successfully regenerated articles for specified categories and saved to GitHub.`);

    // Trigger Vercel deployment hook to publish changes
    if (process.env.VERCEL_DEPLOY_HOOK_URL) {
      console.log('Triggering Vercel deployment hook...');
      const deployResponse = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
      if (!deployResponse.ok) {
        console.error('Failed to trigger Vercel deploy hook:', await deployResponse.text());
      } else {
        console.log('Vercel deployment triggered successfully.');
      }
    } else {
      console.warn('VERCEL_DEPLOY_HOOK_URL is not set. Skipping deployment trigger.');
    }

    return NextResponse.json({ success: true, message: `Articles for "${categoriesToUpdate.join(', ')}" regenerated and deployment triggered.` });

  } catch (error: any) {
    console.error('CRON job failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
