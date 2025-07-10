
'use server';

import { getContent } from './github';
import { generateAndSaveArticles } from '@/app/actions';
import { featuredTopics, promptsTopics, stylesTopics, tutorialsTopics, storybookTopics, usecasesTopics, inspirationTopics, trendsTopics, technologyTopics, nftTopics } from '@/lib/constants';

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

const categoryTopicsMap: Record<string, string[]> = {
    'Featured': featuredTopics,
    'Prompts': promptsTopics,
    'Styles': stylesTopics,
    'Tutorials': tutorialsTopics,
    'Storybook': storybookTopics,
    'Usecases': usecasesTopics,
    'Inspiration': inspirationTopics,
    'Trends': trendsTopics,
    'Technology': technologyTopics,
    'NFT': nftTopics,
};

// This function now consistently gets the right topics based on the category.
// It no longer needs the topics array to be passed in, removing the source of inconsistency.
export async function getArticles(category: string): Promise<Article[]> {
    const filePath = `src/articles/${category.toLowerCase().replace(/\s/g, '-')}.json`;
    const topics = categoryTopicsMap[category];

    if (!topics) {
        console.error(`No topics defined for category: ${category}`);
        return [];
    }

    const existingContent = await getContent(filePath);
    if (existingContent) {
        try {
            const articles: Article[] = JSON.parse(existingContent.content);
            if (Array.isArray(articles) && articles.length > 0 && articles.every(a => a.slug && a.title)) {
                return articles;
            }
        } catch(e) {
            console.error(`Error parsing existing articles for ${category}, will regenerate.`, e);
        }
    }
    
    console.log(`No valid articles found for ${category}. Generating new ones.`);
    return await generateAndSaveArticles(category, topics);
}
