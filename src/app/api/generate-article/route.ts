
// src/app/api/generate-article/route.ts
import { NextResponse } from 'next/server';
import { generateAndSaveArticles } from '@/lib/articles';

// This API route is a lightweight wrapper, primarily for manual triggers.
// The main automatic logic is in the CRON job at /api/cron/regenerate-articles.
export async function POST(req: Request) {
  try {
    const { category } = await req.json();
    
    if (!category || typeof category !== 'string') {
        return NextResponse.json({ error: 'Category is required and must be a string.' }, { status: 400 });
    }

    // Handle full category regeneration
    console.log(`Manual trigger for category regeneration: "${category}"`);
    await generateAndSaveArticles(category);
    
    return NextResponse.json({ success: true, message: `Successfully regenerated articles for category: ${category}` });

  } catch (error: any) {
    console.error('[GENERATE_ARTICLE_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate articles', details: error.message }, { status: 500 });
  }
}
