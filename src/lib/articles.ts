'use server';

import { getContent, saveContent } from './github';
import { featuredTopics, promptsTopics, stylesTopics, tutorialsTopics, storybookTopics, usecasesTopics, inspirationTopics, trendsTopics, technologyTopics, nftTopics } from '@/lib/constants';

// This is the base URL of the deployed application.
// It's crucial for calling the API route from a server-side function.
// In Vercel, this variable is automatically set. For local dev, it's http://localhost:3000
const APP_URL = process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000';

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

async function parseAndValidateArticle(aiResponse: any, topic: string): Promise<Omit<Article, 'image' | 'dataAiHint' | 'slug' | 'category'> & { imagePrompt: string }> {
    const { title, articleContent, keyTakeaways, conclusion, imagePrompt } = aiResponse;

    if (!title || typeof title !== 'string' || title.trim() === '' || !Array.isArray(articleContent) || articleContent.length === 0 || !Array.isArray(keyTakeaways) || !conclusion || !imagePrompt) {
        console.error("Validation failed for AI response on topic:", topic, aiResponse);
        throw new Error(`AI response for topic "${topic}" is missing required fields or has invalid format.`);
    }

    return { title, articleContent, keyTakeaways, conclusion, imagePrompt };
}


// This function now calls our own API route to generate the article content.
async function generateSingleArticle(topic: string, category: string): Promise<Article | null> {
    console.log(`Calling API to generate article for topic: "${topic}" in category: "${category}"`);
    
    const response = await fetch(`${APP_URL}/api/generate-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate article via API route.');
    }
    
    const aiJsonResponse = await response.json();

    let parsedData;
    try {
        parsedData = await parseAndValidateArticle(aiJsonResponse, topic);
    } catch (validationError) {
        console.error(`Validation failed for generated article on topic "${topic}". Skipping save.`, validationError);
        return null;
    }

    const { title, articleContent, keyTakeaways, conclusion, imagePrompt } = parsedData;
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
    if (!slug) {
        console.error(`Generated an invalid or empty slug for title: "${title}". Skipping article.`);
        return null;
    }

    const width = 600;
    const height = 400;
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const finalImagePrompt = `${imagePrompt}, ${category}, high detail, vibrant, professional photo`;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalImagePrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    const dataAiHint = imagePrompt.split(' ').slice(0, 2).join(' ');

    return {
      image: pollinationsUrl,
      dataAiHint: dataAiHint,
      category,
      title,
      slug,
      articleContent,
      keyTakeaways,
      conclusion,
    };
}


export async function generateAndSaveArticles(category: string, topics: string[]): Promise<Article[]> {
    console.log(`Generating and saving articles for category: ${category}`);
    const newArticles: Article[] = [];

    // We can run these in parallel to speed things up
    const articlePromises = topics.map(topic => 
        generateSingleArticle(topic, category).catch(error => {
            console.error(`Failed to generate article for topic: "${topic}". Skipping.`, error);
            return null; // Return null on error so Promise.all doesn't fail
        })
    );
    
    const results = await Promise.all(articlePromises);

    // Filter out any null results from failed generations
    results.forEach(article => {
        if (article) {
            newArticles.push(article);
        }
    });

    if (newArticles.length > 0) {
        const filePath = `src/articles/${category.toLowerCase().replace(/\s/g, '-')}.json`;
        const existingFile = await getContent(filePath);
        await saveContent(
            filePath,
            JSON.stringify(newArticles, null, 2),
            `feat: update articles for ${category}`,
            existingFile?.sha
        );
        console.log(`Successfully saved ${newArticles.length} articles to ${filePath}`);
    } else {
        console.warn(`No articles were successfully generated for category: ${category}. Nothing to save.`);
    }

    return newArticles;
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
            // Basic validation to ensure it's a non-empty array of articles
            if (Array.isArray(articles) && articles.length > 0 && articles.every(a => a.slug && a.title)) {
                return articles;
            }
        } catch(e) {
            console.warn(`Could not parse or validate existing articles for ${category}. Regenerating...`, e);
        }
    }
    
    // If no valid articles are found, generate and save new ones, then return them.
    const newArticles = await generateAndSaveArticles(category, topics);
    return newArticles;
}
