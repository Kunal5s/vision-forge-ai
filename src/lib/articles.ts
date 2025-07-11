
'use server';

import 'dotenv/config';
import { getContent, saveContent } from './github';
import { 
    featuredTopics, promptsTopics, stylesTopics, tutorialsTopics, 
    storybookTopics, usecasesTopics, inspirationTopics, trendsTopics, 
    technologyTopics, nftTopics
} from '@/lib/constants';
import path from 'path';
import fs from 'fs/promises';


const JSON_PROMPT_STRUCTURE = `You are a world-class content creator and SEO expert with a special talent for writing in a deeply human, engaging, and emotional tone. Your task is to generate a comprehensive, well-structured, and fully humanized long-form article for an AI Image Generator website.

**Primary Goal:** The article must be original, creative, helpful, and written in a tone that feels like a warm, exciting, and empowering conversation with a friendly expert.

**Tone and Style - CRITICAL INSTRUCTIONS:**
1.  **Human, Not Robotic:** Your writing MUST be conversational. Use "I," "you," and "we" to build a direct connection. Paragraphs MUST be very short (1-3 sentences) for easy reading.
2.  **Emotional and Engaging:** Infuse the text with genuine emotion. Use a variety of tones like "Empowering," "Friendly," "Creative," "Motivating," and "Conversational". Make the reader feel excited and motivated.
3.  **No Jargon:** Explain complex topics in a simple, easy-to-understand way. Avoid technical jargon.

**JSON Structure Template & Rules:**
You MUST respond with a single, valid JSON object. Do not include any text, comments, or markdown before or after the JSON.
{
  "title": "A catchy, EXACTLY 9-word title about the topic.",
  "articleContent": [
    { "type": "h2", "content": "First main heading." },
    { "type": "p", "content": "A very short, engaging paragraph (1-2 sentences)." },
    { "type": "p", "content": "Another short, friendly paragraph." },
    { "type": "h3", "content": "A subheading to dive deeper." },
    { "type": "p", "content": "A detailed but concise paragraph." },
    { "type": "h4", "content": "A more specific heading." },
    { "type": "p", "content": "A simple explanation." },
    { "type": "h5", "content": "A heading for a small detail." },
    { "type": "p", "content": "A final short paragraph for this section." },
    { "type": "h6", "content": "An even more specific heading." },
    { "type": "p", "content": "A final short paragraph for this subsection." }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5", "Takeaway 6"],
  "conclusion": "A strong, empowering, and short concluding paragraph.",
  "imagePrompt": "A 10-15 word, highly descriptive prompt for a beautiful header image."
}

**Content & Formatting - CRITICAL INSTRUCTIONS:**
1.  **Total Word Count:** The combined text of all "content" fields MUST be approximately 2000 words.
2.  **Heading Structure:** The "articleContent" array MUST use a logical and deep heading structure, including H2, H3, H4, and even H5/H6 tags to break down the topic comprehensively. This is compulsory.
3.  **Title Constraint:** The "title" MUST be exactly 9 words long.
4.  **Key Takeaways:** The "keyTakeaways" array MUST contain exactly 6 concise, insightful, and helpful bullet-point style takeaways.
5.  **Relevance:** The content must be highly relevant to the TOPIC and CATEGORY provided.
6.  **Strict JSON:** The entire output must be a single, valid JSON object, ready for parsing.`;

const PRIORITY_MODELS = [
    "mistralai/mistral-7b-instruct",
    "openchat/openchat-3.5",
    "huggingfaceh4/zephyr-7b-beta",
    "meta-llama/llama-3-8b-instruct",
    "qwen/qwen-2-7b-instruct",
];

const FALLBACK_MODELS = [
    "gryphe/mythomax-l2-13b",
    "google/gemini-pro"
];

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

async function generateWithOpenRouter(model: string, topic: string, category: string): Promise<any | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenRouter API key is not configured.');
    }
    const fullPrompt = `${JSON_PROMPT_STRUCTURE}\n\nNow, generate the content for:\nTopic: "${topic}"\nCategory: "${category}"`;
    
    try {
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: fullPrompt }],
                response_format: { type: "json_object" },
            }),
        });

        if (!openRouterResponse.ok) {
            const errorBody = await openRouterResponse.text();
            console.warn(`OpenRouter model ${model} failed with status: ${openRouterResponse.status}`, errorBody);
            return null;
        }

        const openRouterData = await openRouterResponse.json();
        const content = openRouterData.choices[0]?.message?.content;
        
        if (!content) {
          console.warn(`OpenRouter model ${model} returned empty content.`);
          return null;
        }
        
        return JSON.parse(content);
    } catch (error) {
        console.warn(`Request to OpenRouter model ${model} failed.`, error);
        return null;
    }
}

async function parseAndValidateArticle(aiResponse: any, topic: string): Promise<Omit<Article, 'image' | 'dataAiHint' | 'slug' | 'category'> & { imagePrompt: string }> {
    const { title, articleContent, keyTakeaways, conclusion, imagePrompt } = aiResponse;

    if (!title || typeof title !== 'string' || title.trim() === '' || !Array.isArray(articleContent) || articleContent.length === 0 || !Array.isArray(keyTakeaways) || !conclusion || !imagePrompt) {
        console.error("Validation failed for AI response on topic:", topic, aiResponse);
        throw new Error(`AI response for topic "${topic}" is missing required fields or has invalid format.`);
    }

    return { title, articleContent, keyTakeaways, conclusion, imagePrompt };
}

export async function generateSingleArticle(topic: string, category: string): Promise<Article | null> {
    let aiJsonResponse: any | null = null;
    const allModels = [...PRIORITY_MODELS, ...FALLBACK_MODELS];
    
    for (const model of allModels) {
        console.log(`Attempting to generate article for topic "${topic}" with model: ${model}`);
        aiJsonResponse = await generateWithOpenRouter(model, topic, category);
        if (aiJsonResponse) {
            console.log(`Successfully generated content with model: ${model}`);
            break; 
        }
    }

    if (!aiJsonResponse) {
        console.error(`All models failed to generate the article for topic: "${topic}".`);
        return null;
    }

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

    const article: Article = {
      image: pollinationsUrl,
      dataAiHint: dataAiHint,
      category,
      title,
      slug,
      articleContent,
      keyTakeaways,
      conclusion,
    };
    
    return article;
}


const allTopicsByCategory: Record<string, string[]> = {
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

// This function is for ONE-TIME local generation, or for the CRON job.
export async function generateAndSaveArticles(category: string): Promise<Article[]> {
    const topics = allTopicsByCategory[category];
    if (!topics) {
        console.warn(`No topics found for category: ${category}. Cannot generate articles.`);
        return [];
    }

    console.log(`Generating and saving articles for category: ${category}`);
    const newArticles: Article[] = [];

    const articlePromises = topics.map(topic => 
        generateSingleArticle(topic, category).catch(error => {
            console.error(`Failed to generate article for topic: "${topic}". Skipping.`, error);
            return null;
        })
    );
    
    const results = await Promise.all(articlePromises);

    results.forEach(article => {
        if (article) {
            newArticles.push(article);
        }
    });

    if (newArticles.length > 0) {
        const filePath = `src/articles/${category.toLowerCase().replace(/\s/g, '-')}.json`;
        
        // Check if running in a Node.js environment (local script)
        if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
             const localPath = path.join(process.cwd(), filePath);
             await fs.mkdir(path.dirname(localPath), { recursive: true });
             await fs.writeFile(localPath, JSON.stringify(newArticles, null, 2));
             console.log(`Successfully saved ${newArticles.length} articles to LOCAL file: ${localPath}`);
        } else {
            // This path is for the CRON job running on Vercel
            const existingFile = await getContent(filePath);
            await saveContent(
                filePath,
                JSON.stringify(newArticles, null, 2),
                `feat: update articles for ${category}`,
                existingFile?.sha
            );
            console.log(`Successfully saved ${newArticles.length} articles to GitHub: ${filePath}`);
        }
    } else {
        console.warn(`No articles were successfully generated for category: ${category}. Nothing to save.`);
    }

    return newArticles;
}

const articleCache = new Map<string, Article[]>();

// This is the primary function used by pages to get article data.
// It ONLY READS from the local JSON files. It DOES NOT generate content.
export async function getArticles(category: string): Promise<Article[]> {
    const cacheKey = category;
    if (articleCache.has(cacheKey)) {
        return articleCache.get(cacheKey)!;
    }

    const categorySlug = category.toLowerCase().replace(/\s/g, '-');
    const filePath = `src/articles/${categorySlug}.json`;

    // Production (Vercel): Read from GitHub
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
        try {
            const file = await getContent(filePath);
            if (file) {
                const articles = JSON.parse(file.content);
                articleCache.set(cacheKey, articles);
                return articles;
            }
        } catch (error) {
            console.error(`Error fetching articles from GitHub for category "${category}":`, error);
            return []; // Return empty on error
        }
    }

    // Development or other environments: Read from local file system
    try {
        const articles: Article[] = (await import(`@/articles/${categorySlug}.json`)).default;
        
        if (Array.isArray(articles) && articles.length > 0) {
            articleCache.set(cacheKey, articles);
            return articles;
        }
        
        console.warn(`No articles found for category: "${category}" in the JSON files.`);
        return [];
    } catch (error) {
      console.warn(`Could not import articles for category "${category}". The file might not exist yet. Run 'npm run generate-articles'.`);
      return [];
    }
}
