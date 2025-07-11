
// src/app/api/cron/regenerate-articles/route.ts

import { regenerateFeaturedArticles } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';
import getConfig from 'next/config';

export const dynamic = 'force-dynamic'; // Ensures this route is always executed dynamically

export async function POST(req: NextRequest) {
  const { serverRuntimeConfig } = getConfig();
  const CRON_SECRET = serverRuntimeConfig.CRON_SECRET;
  const VERCEL_DEPLOY_HOOK_URL = serverRuntimeConfig.VERCEL_DEPLOY_HOOK_URL;

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('CRON job started: Regenerating featured articles...');

  try {
    // 1. Regenerate articles and save them to GitHub
    const regenerationResult = await regenerateFeaturedArticles();
    if (!regenerationResult.success) {
      throw new Error(regenerationResult.message);
    }
    console.log('Successfully regenerated articles and saved to GitHub.');

    // 2. Trigger Vercel deployment hook to publish changes
    if (VERCEL_DEPLOY_HOOK_URL) {
      console.log('Triggering Vercel deployment hook...');
      const deployResponse = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
      if (!deployResponse.ok) {
        console.error('Failed to trigger Vercel deploy hook:', await deployResponse.text());
        // We don't throw an error here, as the articles are already saved.
        // The deployment can be triggered manually if needed.
      } else {
        console.log('Vercel deployment triggered successfully.');
      }
    } else {
      console.warn('VERCEL_DEPLOY_HOOK_URL is not set. Skipping deployment trigger.');
    }

    return NextResponse.json({ success: true, message: 'Featured articles regenerated and deployment triggered.' });

  } catch (error: any) {
    console.error('CRON job failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
