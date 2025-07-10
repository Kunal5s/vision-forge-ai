// src/app/api/generate-article/route.ts
import { NextResponse } from 'next/server';
import { generateAndSaveSingleArticle } from '@/lib/articles';

export const runtime = 'edge';

// This API route is now a lightweight wrapper around the core logic in /src/lib/articles.ts
// It is used for client-side calls or external triggers, not for server-side page generation.
export async function POST(req: Request) {
  try {
    const { topic, category } = await req.json();
    
    if (!topic || !category) {
        return NextResponse.json({ error: 'Topic and category are required.' }, { status: 400 });
    }

    // The core logic is now in a reusable function.
    const article = await generateAndSaveSingleArticle(topic, category);

    if (!article) {
        return NextResponse.json({ error: `Failed to generate the article for topic: "${topic}".` }, { status: 500 });
    }
    
    // We only need to return the generated article data.
    // The responsibility of saving it is handled within the lib function itself.
    return NextResponse.json(article);

  } catch (error: any) {
    console.error('[GENERATE_ARTICLE_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate article', details: error.message }, { status: 500 });
  }
}
