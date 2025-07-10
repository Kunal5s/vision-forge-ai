
'use server';

import { getContent } from './github';
import { generateAndSaveArticles } from '@/app/actions';

interface ArticleContentBlock {
    type: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
    content: string;
}

interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    slug: string;
    articleContent: ArticleContentBlock[];
    keyTakeaways: string[];
    conclusion: string;
}

interface GenerationOptions {
    forceRegenerate?: boolean;
}

export async function getArticles(category: string, topics: string[], options: GenerationOptions = {}): Promise<Article[]> {
    const filePath = `articles/${category.toLowerCase().replace(/\s/g, '-')}.json`;

    if (!options.forceRegenerate) {
        const existingContent = await getContent(filePath);
        if (existingContent) {
            try {
                const articles: Article[] = JSON.parse(existingContent.content);
                // Basic validation to ensure it's a non-empty array of articles with slugs and titles
                if (Array.isArray(articles) && articles.length > 0 && articles.every(a => a.slug && a.title)) {
                    console.log(`Found existing articles for category: ${category}`);
                    return articles;
                }
            } catch(e) {
                console.error(`Error parsing existing articles for ${category}, will regenerate.`, e);
            }
        }
    }
    
    // If no valid existing articles, generate new ones
    return await generateAndSaveArticles(category, topics);
}
