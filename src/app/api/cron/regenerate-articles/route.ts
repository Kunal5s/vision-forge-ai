
// src/app/api/cron/regenerate-articles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateAndSaveArticles } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { getContent, saveContent } from '@/lib/github';

export const dynamic = 'force-dynamic';

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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categoryToUpdate = await getNextCategoryForUpdate();
    if (!categoryToUpdate) {
        console.log('CRON job ran, but no category was scheduled for update.');
        return NextResponse.json({ success: true, message: 'No category scheduled for update.' });
    }

    console.log(`CRON job started: Regenerating articles for category: "${categoryToUpdate}"...`);

    // Regenerate articles for the determined category and save them to GitHub
    await generateAndSaveArticles(categoryToUpdate);
    console.log(`Successfully regenerated articles for ${categoryToUpdate} and saved to GitHub.`);

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

    return NextResponse.json({ success: true, message: `Articles for "${categoryToUpdate}" regenerated and deployment triggered.` });

  } catch (error: any) {
    console.error('CRON job failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
