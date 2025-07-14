
// src/app/api/generate-article/route.ts
import { NextResponse } from 'next/server';

// This API route is a lightweight wrapper, primarily for manual triggers.
// The main automatic logic is in the CRON job at /api/cron/regenerate-articles.
// Note: This route is now largely deprecated in favor of the admin panel actions.
export async function POST(req: Request) {
  try {
    const { category } = await req.json();
    
    if (!category || typeof category !== 'string') {
        return NextResponse.json({ error: 'Category is required and must be a string.' }, { status: 400 });
    }

    // The core logic for this has been moved to the admin panel.
    // This endpoint can be kept for backward compatibility or future cron jobs, but it's not used by the UI.
    console.log(`Manual trigger received for category: "${category}", but this route is deprecated.`);
    
    return NextResponse.json({ success: true, message: `Route for category ${category} is deprecated. Use admin panel.` });

  } catch (error: any) {
    console.error('[GENERATE_ARTICLE_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate articles', details: error.message }, { status: 500 });
  }
}
