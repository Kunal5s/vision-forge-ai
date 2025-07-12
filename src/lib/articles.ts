
'use server';

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { saveArticleToGithub } from './github';

// This is the new list of models provided by the user, prioritized for performance and free usage.
const ALL_MODELS_IN_ORDER = [
    "unfiltered/zephyr-141b-a35b:beta", // A very powerful model, good to try first.
    "nousresearch/nous-hermes-2-mixtral-8x7b-dpo", // Top-tier Mixtral fine-tune
    "mistralai/mistral-7b-instruct",
    "openchat/openchat-8192",
    "cognitivecomputations/dolphin-mixtral-8x7b",
    "anthropic/claude-3.5-sonnet",
    "google/gemma-2-9b-it",
    "microsoft/phi-3-medium-128k-instruct",
    "yi-large/yi-1.5-34b-chat",
    "mistralai/mixtral-8x22b",
];

// This is the ideal structure we want from the AI model, now targeting 3000 words.
const JSON_PROMPT_STRUCTURE = `
You are an expert SEO article writer and a master of long-form content. Generate an article based on the topic provided.
The response must be a single, valid JSON object that adheres to the following structure. Do not add any text before or after the JSON object.

{
  "image": "A highly descriptive, vivid, and imaginative prompt for an AI image generator to create a relevant, professional photo for the article. This should be a single, detailed sentence. For example: 'A glowing brain with intricate neural pathways, representing the art of crafting AI prompts, hyper-realistic, high detail, vibrant, cinematic lighting, professional photo'.",
  "dataAiHint": "one or two keywords for an AI image generator to create a relevant image for the article. For example: 'futuristic brain'.",
  "category": "The category of the article, which will be provided.",
  "title": "A compelling, SEO-friendly title for the article, exactly 9 words long.",
  "slug": "The URL-friendly slug for the article, based on the title. For example: 'the-art-of-crafting-compelling-ai-prompts'.",
  "articleContent": [
    { "type": "h2", "content": "A compelling H2 subheading for the first main section." },
    { "type": "p", "content": "The first paragraph of the section, around 200-250 words, providing a strong introduction to the section's topic." },
    { "type": "p", "content": "The second paragraph of the section, around 200-250 words, expanding on the first paragraph with more details, examples, or insights." },
    { "type": "h3", "content": "A relevant and interesting H3 subheading that dives deeper into a sub-topic." },
    { "type": "p", "content": "A detailed paragraph for the H3 subheading, around 200-250 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the second main section." },
    { "type": "p", "content": "A detailed paragraph for this section, around 200-250 words." },
    { "type": "p", "content": "Another detailed paragraph for this section, around 200-250 words, offering a different perspective or additional information." },
    { "type": "h2", "content": "A compelling H2 subheading for the third main section." },
    { "type": "p", "content": "A detailed paragraph for this section, around 200-250 words." },
    { "type": "p", "content": "Another detailed paragraph for this section, around 200-250 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the fourth main section." },
    { "type": "p", "content": "A detailed paragraph for this section, around 200-250 words." },
    { "type": "p", "content": "Another detailed paragraph for this section, around 200-250 words." }
  ],
  "keyTakeaways": [
    "A sharp, insightful key takeaway from the article.",
    "Another sharp, insightful key takeaway from the article.",
    "A third sharp, insightful key takeaway from the article.",
    "A fourth sharp, insightful key takeaway from the article."
  ],
  "conclusion": "A powerful and compelling concluding paragraph, around 250-300 words, that summarizes the article's main points, offers a final thought-provoking insight, and leaves a lasting impression on the reader."
}
Ensure the entire output is a single JSON object. The total word count of the article content and conclusion should be approximately 3000 words.
`;

export interface ArticleContentBlock {
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
            console.log(`No local articles file found for "${category}". This is okay if they need to be generated.`);
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}

async function generateArticleFromModel(model: string, topic: string, category: string): Promise<Article | null> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: JSON_PROMPT_STRUCTURE },
                    { role: "user", content: `Generate an article about: "${topic}" for the category "${category}".` }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.warn(`⚠️ Model '${model}' failed with status ${response.status}. Body: ${errorBody}`);
            return null;
        }

        const data = await response.json();
        // Handle cases where the response might be wrapped in a different structure
        let content = data.choices[0].message.content;
        
        // Sometimes the model might wrap the JSON in markdown, so we strip it.
        if (content.startsWith("```json")) {
            content = content.substring(7, content.length - 3).trim();
        }

        const articleJson = JSON.parse(content);

        // Add an image from pollinations.ai
        const imagePrompt = encodeURIComponent(`${articleJson.image}, ${category}, high detail, vibrant, professional photo`);
        const seed = Math.floor(Math.random() * 1_000_000_000);
        articleJson.image = `https://image.pollinations.ai/prompt/${imagePrompt}?width=600&height=400&seed=${seed}&nologo=true`;

        return articleJson as Article;
    } catch (error) {
        console.warn(`⚠️ An error occurred while generating article with model '${model}':`, error);
        return null;
    }
}

export async function generateAndSaveArticles(category: string, topics: string[]) {
    console.log(`Starting article generation for category: "${category}"...`);
    const articles: Article[] = [];

    // First, read existing articles to avoid overwriting them.
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);
    
    let existingArticles: Article[] = [];
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        existingArticles = JSON.parse(fileContent);
        if (!Array.isArray(existingArticles)) {
            existingArticles = [];
        }
    } catch (error) {
        // File might not exist, which is fine.
        existingArticles = [];
    }

    for (const topic of topics) {
        let article: Article | null = null;
        console.log(`Generating article for topic: "${topic}"`);

        for (const model of ALL_MODELS_IN_ORDER) {
            console.log(`   Trying model: ${model}...`);
            article = await generateArticleFromModel(model, topic, category);
            if (article) {
                console.log(`   ✅ Success! Article generated with model: ${model}`);
                articles.push(article);
                break; // Move to the next topic once we have a successful article
            }
        }

        if (!article) {
            console.error(`❌ All models failed for topic: "${topic}".`);
        }
    }
    
    // Combine existing and new articles, and write them back.
    const allArticles = [...existingArticles, ...articles];

    if (allArticles.length === 0) {
        console.warn(`Could not generate or find any articles for category "${category}".`);
        return;
    }

    await fs.writeFile(filePath, JSON.stringify(allArticles, null, 2), 'utf-8');
    console.log(`✅ Articles for category "${category}" saved locally to ${filePath}`);

    // Now, save the newly generated file to GitHub
    await saveArticleToGithub(category, JSON.stringify(allArticles, null, 2));
}
