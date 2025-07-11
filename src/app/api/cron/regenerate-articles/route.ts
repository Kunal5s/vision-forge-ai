
// src/app/api/cron/regenerate-articles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateAndSaveArticles } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { getContent, saveContent } from '@/lib/github';

export const dynamic = 'force-dynamic';

const STATE_FILE_PATH = 'src/lib/regeneration-state.json';
const CATEGORY_ROTATION = Object.keys(categorySlugMap); // ['featured', 'prompts', ...]

interface RegenerationState {
  lastUpdatedCategoryIndex: number;
}

async function getNextCategoryForUpdate(): Promise<string> {
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

    const nextIndex = (state.lastUpdatedCategoryIndex + 1) % CATEGORY_ROTATION.length;
    const nextCategorySlug = CATEGORY_ROTATION[nextIndex];
    
    // Convert slug back to the proper category name (e.g., 'featured' -> 'Featured')
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
    
    return nextCategoryName;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categoryToUpdate = await getNextCategoryForUpdate();
    console.log(`CRON job started: Regenerating articles for category: "${categoryToUpdate}"...`);

    // 1. Regenerate articles for the determined category and save them to GitHub
    // The generateAndSaveArticles function is already set up to use the correct topics for a given category.
    await generateAndSaveArticles(categoryToUpdate);
    console.log(`Successfully regenerated articles for "${categoryToUpdate}" and saved to GitHub.`);

    // 2. Trigger Vercel deployment hook to publish changes
    if (process.env.VERCEL_DEPLOY_HOOK_URL) {
      console.log('Triggering Vercel deployment hook...');
      const deployResponse = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
      if (!deployResponse.ok) {
        // Log the error but don't fail the entire job, as the articles are already saved.
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
