
'use server';

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { saveArticleToGithub } from './github';

// This is the new list of models provided by the user, prioritized for performance and free usage.
const ALL_MODELS_IN_ORDER = [
    "ollama/zephyr:latest",
    "ollama/mistral:instruct",
    "openchat/openchat-7b-v3.2",
    "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
    "microsoft/phi-3-mini-128k-instruct",
    "google/gemma-7b-it",
    "anthropic/claude-3-haiku-20240307",
    "yi-large/yi-1.5-9b-chat",
    "core-mistral/mistral-large-2402",
    "neversleep/reka-core",
];


// This is the ideal structure we want from the AI model, now targeting 3000 words with H1-H6.
const JSON_PROMPT_STRUCTURE = `
You are an expert SEO article writer and a master of long-form, 3000-word content. Generate an article based on the topic provided.
The response must be a single, valid JSON object that adheres to the following structure. Do not add any text before or after the JSON object.

{
  "image": "A highly descriptive, vivid, and imaginative prompt for an AI image generator to create a relevant, professional photo for the article. This should be a single, detailed sentence. For example: 'A glowing brain with intricate neural pathways, representing the art of crafting AI prompts, hyper-realistic, high detail, vibrant, cinematic lighting, professional photo'.",
  "dataAiHint": "one or two keywords for an AI image generator to create a relevant image for the article. For example: 'futuristic brain'.",
  "category": "The category of the article, which will be provided.",
  "title": "A compelling, SEO-friendly title for the article, exactly 9 words long, based on the provided topic.",
  "slug": "The URL-friendly slug for the article, based on the title. For example: 'the-art-of-crafting-compelling-ai-prompts'.",
  "articleContent": [
    { "type": "h1", "content": "The Main Title of the Article (same as the 'title' field)." },
    { "type": "p", "content": "A captivating introductory paragraph of around 150-200 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the first main section." },
    { "type": "p", "content": "The first paragraph of the section, around 200-250 words." },
    { "type": "p", "content": "The second paragraph of the section, around 200-250 words." },
    { "type": "h3", "content": "A relevant and interesting H3 subheading that dives deeper into a sub-topic." },
    { "type": "p", "content": "A detailed paragraph for the H3 subheading, around 200-250 words." },
    { "type": "h4", "content": "An H4 subheading for a more granular point." },
    { "type": "p", "content": "A supporting paragraph for the H4, around 150-200 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the second main section." },
    { "type": "p", "content": "A detailed paragraph for this section, around 200-250 words." },
    { "type": "p", "content": "Another detailed paragraph for this section, around 200-250 words." },
    { "type": "h3", "content": "Another H3 subheading to elaborate on a key aspect." },
    { "type": "p", "content": "A detailed paragraph for this H3, around 200-250 words." },
    { "type": "h5", "content": "An H5 subheading for a very specific detail or example." },
    { "type": "p", "content": "A concise paragraph for the H5, around 100-150 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the third main section." },
    { "type": "p", "content": "A detailed paragraph for this section, around 200-250 words." },
    { "type": "p", "content": "Another detailed paragraph for this section, around 200-250 words." },
    { "type": "h6", "content": "An H6 subheading for a minor note, tip, or fact." },
    { "type": "p", "content": "A short paragraph for the H6, around 100 words." }
  ],
  "keyTakeaways": [
    "A sharp, insightful key takeaway from the article.",
    "Another sharp, insightful key takeaway from the article.",
    "A third sharp, insightful key takeaway from the article.",
    "A fourth sharp, insightful key takeaway from the article."
  ],
  "conclusion": "A powerful and compelling concluding paragraph, around 250-300 words, that summarizes the article's main points and offers a final thought-provoking insight."
}
Ensure the entire output is a single JSON object. The total word count of the article content and conclusion should be approximately 3000 words.
`;

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
    articleContent: ArticleContentBlock[];
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
            console.log(`No local articles file found for "${category}". This is okay if they need to be generated.`);
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}

async function generateArticleFromModel(model: string, topic: string, category: string): Promise<Article | null> {
    try {
        console.log(`   Trying to generate with model: ${model}`);
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
        let content = data.choices[0].message.content;
        
        if (content.startsWith("```json")) {
            content = content.substring(7, content.length - 3).trim();
        }

        const articleJson = JSON.parse(content);

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
    const newArticles: Article[] = [];

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
        existingArticles = [];
    }

    for (const topic of topics) {
        let article: Article | null = null;
        console.log(`Generating article for topic: "${topic}"`);

        for (const model of ALL_MODELS_IN_ORDER) {
            article = await generateArticleFromModel(model, topic, category);
            if (article) {
                console.log(`   ✅ Success! Article generated for '${topic}' with model: ${model}`);
                newArticles.push(article);
                break; 
            }
        }

        if (!article) {
            console.error(`❌ All models failed for topic: "${topic}". Moving to the next topic.`);
        }
    }
    
    const allArticles = [...existingArticles, ...newArticles];

    if (allArticles.length === 0) {
        console.warn(`Could not generate or find any articles for category "${category}".`);
        return;
    }

    await fs.writeFile(filePath, JSON.stringify(allArticles, null, 2), 'utf-8');
    console.log(`✅ Articles for category "${category}" saved locally to ${filePath}`);

    await saveArticleToGithub(category, JSON.stringify(allArticles, null, 2));
}
