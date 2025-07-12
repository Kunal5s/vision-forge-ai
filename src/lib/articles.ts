
'use server';

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

interface ArticleContentBlock {
    type: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
    content: string;
}

export interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    slug: string;
    articleContent: ArticleContentBlock[];
    keyTakeaways: string[];
    conclusion: string;
}

const articleCache = new Map<string, Article[]>();

// This is the primary function used by pages to get article data.
// It reads from the local JSON files.
export async function getArticles(category: string): Promise<Article[]> {
    const cacheKey = category;
    
    if (articleCache.has(cacheKey)) {
        return articleCache.get(cacheKey)!;
    }

    const categorySlug = category.toLowerCase().replace(/\s/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);

    try {
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
            console.warn(`No articles file found for category "${category}". This is expected if the site uses static content.`);
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}
