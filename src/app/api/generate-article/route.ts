
// src/app/api/generate-article/route.ts
import { NextResponse } from 'next/server';
import { generateSingleArticle, getArticles, saveArticlesForCategory } from '@/lib/articles';

// This function is now the core logic for adding a new article and archiving old ones.
export async function generateAndSaveSingleArticle(topic: string, category: string) {
    // 1. Generate one new article
    const newArticle = await generateSingleArticle(topic, category);
    if (!newArticle) {
        console.error(`Failed to generate a new article for topic: "${topic}".`);
        return null;
    }

    // 2. Get all current articles for the category
    // We pass `forceFetch: true` to bypass any cache and read directly from GitHub
    const currentArticles = await getArticles(category, true);

    // 3. Add the new article to the top of the list
    const updatedArticles = [newArticle, ...currentArticles];

    // 4. Save the updated list back to GitHub
    await saveArticlesForCategory(category, updatedArticles);
    
    console.log(`Successfully generated and archived article for topic: "${topic}" in category: "${category}".`);
    return newArticle;
}


// This API route is a lightweight wrapper, primarily for potential manual triggers or testing.
// The main logic is now in the CRON job.
export async function POST(req: Request) {
  try {
    const { topic, category } = await req.json();
    
    if (!topic || !category) {
        return NextResponse.json({ error: 'Topic and category are required.' }, { status: 400 });
    }

    const article = await generateAndSaveSingleArticle(topic, category);

    if (!article) {
        return NextResponse.json({ error: `Failed to generate and save the article for topic: "${topic}".` }, { status: 500 });
    }
    
    return NextResponse.json(article);

  } catch (error: any) {
    console.error('[GENERATE_ARTICLE_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate article', details: error.message }, { status: 500 });
  }
}
