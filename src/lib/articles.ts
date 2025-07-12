
'use server';

import 'dotenv/config';
import { getContent, saveContent } from './github';
import fs from 'fs/promises';
import path from 'path';
import { 
    categorySlugMap, allTopicsByCategory
} from './constants';


const JSON_PROMPT_STRUCTURE = `You are a world-class content creator and SEO expert with a special talent for writing in a deeply human, engaging, and emotional tone. Your task is to generate a comprehensive, well-structured, and fully humanized long-form article for an AI Image Generator website.

**Primary Goal:** The article must be original, creative, helpful, and written in a tone that feels like a warm, exciting, and empowering conversation with a friendly expert.

**Tone and Style - CRITICAL INSTRUCTIONS:**
1.  **Human, Not Robotic:** Your writing MUST be conversational. Use "I," "you," and "we" to build a direct connection. Paragraphs MUST be very short (1-3 sentences) for easy reading.
2.  **Emotional and Engaging:** Infuse the text with genuine emotion. Use a variety of tones like "Empowering," "Friendly," "Creative," "Motivating," and "Conversational". Make the reader feel excited and motivated.
3.  **No Jargon:** Explain complex topics in a simple, easy-to-understand way. Avoid technical jargon.
4.  **No Asterisks for Bolding:** Do NOT use asterisks or any other markdown for bolding. The text should be plain.
5.  **Internal Linking:** Where appropriate, naturally weave in internal links to other relevant categories. For example, if you mention creating a consistent character, you could link to the 'Storybook' category. Use the format: "<a href=\\"/storybook\\">creating consistent characters</a>". Other categories to link to include "prompts", "styles", "tutorials", "usecases", "inspiration", "trends", "technology", "nft".

**JSON Structure Template & Rules:**
You MUST respond with a single, valid JSON object. Do not include any text, comments, or markdown before or after the JSON.
{
  "title": "A catchy, EXACTLY 9-word title about the topic.",
  "articleContent": [
    { "type": "h2", "content": "First main heading." },
    { "type": "p", "content": "A very short, engaging paragraph (1-2 sentences)." },
    { "type": "p", "content": "Another short, friendly paragraph. Maybe this one talks about different <a href=\\"/styles\\">artistic styles</a>." },
    { "type": "h3", "content": "A subheading to dive deeper." },
    { "type": "p", "content": "A detailed but concise paragraph." },
    { "type": "h4", "content": "A more specific heading." },
    { "type": "p", "content": "A simple explanation. This could link to our <a href=\\"/tutorials\\">tutorials</a>." },
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

// List of high-quality models to try in order of preference.
const MODELS_TO_TRY = [
    "cognitivecomputations/dolphin-mixtral-8x7b", // User's preferred model
    "deepseek/deepseek-chat",
    "mistralai/mistral-7b-instruct",
    "google/gemma-7b-it",
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

async function generateWithOpenRouter(topic: string, category: string): Promise<any | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenRouter API key is not configured.');
    }
    const fullPrompt = `${JSON_PROMPT_STRUCTURE}\n\nNow, generate the content for:\nTopic: "${topic}"\nCategory: "${category}"`;
    
    for (const model of MODELS_TO_TRY) {
        console.log(`  -> Attempting generation for topic "${topic}" with model: ${model}`);
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

            if (openRouterResponse.ok) {
                const openRouterData = await openRouterResponse.json();
                const content = openRouterData.choices[0]?.message?.content;
                
                if (content) {
                    console.log(`  ✔ Success with model: ${model}`);
                    return JSON.parse(content);
                }
                console.warn(`  ! Model ${model} returned empty content. Trying next model.`);
            } else {
                const errorBody = await openRouterResponse.text();
                console.warn(`  ! Model ${model} failed with status: ${openRouterResponse.status}. Trying next model. Error: ${errorBody}`);
            }
        } catch (error) {
            console.error(`  ✖ Request to model ${model} failed. Trying next model.`, error);
        }
    }
    
    console.error(`All models failed to generate content for topic: "${topic}"`);
    return null; // Return null if all models fail
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
    const aiJsonResponse = await generateWithOpenRouter(topic, category);

    if (!aiJsonResponse) {
        console.error(`All models failed for topic: "${topic}".`);
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


// Saves a full list of articles for a category, overwriting the existing file.
export async function saveArticlesForCategory(category: string, articles: Article[]) {
    const categorySlug = category.toLowerCase().replace(/\s/g, '-');
    const filePath = `src/articles/${categorySlug}.json`;
    const existingFile = await getContent(filePath);
    await saveContent(
        filePath,
        JSON.stringify(articles, null, 2),
        `feat: update articles for ${category}`,
        existingFile?.sha
    );
    console.log(`Successfully saved ${articles.length} total articles to GitHub for category: ${category}`);
}


const articleCache = new Map<string, Article[]>();

// This is the primary function used by pages to get article data.
// It reads from the local JSON files.
export async function getArticles(category: string, forceFetch = false): Promise<Article[]> {
    const cacheKey = category;
    
    // In a serverless environment, we bypass the cache if forceFetch is true.
    // This ensures we get the latest data from the source after a generation.
    if (forceFetch && articleCache.has(cacheKey)) {
        articleCache.delete(cacheKey);
    }
    
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
            // This is now expected if the content hasn't been generated yet.
            // Returning an empty array is the correct behavior.
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}


/**
 * Generates new articles for a given category and prepends them to the existing list.
 * This is the primary function to be called by generation scripts.
 * @param category The name of the category to generate articles for (e.g., 'Featured').
 */
export async function generateAndSaveArticles(category: string) {
    const topics = allTopicsByCategory[category];
    if (!topics) {
        console.error(`No topics found for category: ${category}`);
        return;
    }

    // We generate 4 new articles for the category
    const topicsToGenerate = topics.slice(0, 4);
    let newArticles: Article[] = [];

    for (const topic of topicsToGenerate) {
        try {
            const article = await generateSingleArticle(topic, category);
            if (article) {
                newArticles.push(article);
                console.log(`  ✔ Successfully generated article for topic: "${topic}"`);
            } else {
                console.log(`  ✖ Failed to generate article for topic: "${topic}"`);
            }
        } catch (error) {
            console.error(`  ✖ An error occurred while generating article for topic: "${topic}"`, error);
        }
    }

    if (newArticles.length > 0) {
        // Fetch the current list of articles to prepend to
        const currentArticles = await getArticles(category, true); // forceFetch to get latest from source

        // Prepend new articles to the existing ones for archival
        const updatedArticles = [...newArticles, ...currentArticles];

        // Save the combined list back
        await saveArticlesForCategory(category, updatedArticles);
        console.log(`Successfully generated ${newArticles.length} new articles and saved ${updatedArticles.length} total articles for ${category}.`);
    } else {
        console.warn(`No new articles were generated for ${category}, nothing to save.`);
    }
}
