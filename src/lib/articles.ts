
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface ArticleContentBlock {
    type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
    content: string;
}

export interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    slug: string;
    articleContent: ArticleContentBlock[] | string;
    keyTakeaways: string[];
    conclusion:string;
}

const articleCache = new Map<string, Article[]>();

export async function getArticles(category: string): Promise<Article[]> {
    const cacheKey = category;
    if (articleCache.has(cacheKey)) {
        return articleCache.get(cacheKey)!;
    }

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);

    try {
        await fs.access(filePath); // Check if file exists
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const articles: Article[] = JSON.parse(fileContent);

        if (Array.isArray(articles)) {
            articleCache.set(cacheKey, articles);
            return articles;
        }

        console.warn(`Data in ${categorySlug}.json is not an array.`);
        return [];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log(`No local articles file found for "${category}".`);
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}
