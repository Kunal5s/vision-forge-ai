
'use server';

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { saveArticleToGithub } from './github';

// This is the list of models the user wants to try, in order of preference.
const ALL_MODELS_IN_ORDER = [
    "qwen/qwen3-32b-chat",
    "qwen/qwen3-30b-a3b",
    "qwen/qwen3-8b",
    "shisaai/shisa-v2-llama3-70b",
    "tencent/hunyuan-a13b-chat",
    "mistralai/mixtral-8x7b-instruct",
    "nousresearch/nous-hermes-2-mixtral",
    "cognitivecomputations/dolphin-2.9",
    "openchat/openchat-3.5",
    "huggingfaceh4/zephyr-7b-beta",
    "meta-llama/llama-3-8b-instruct",
    "openrouter/chronos-hermes-13b",
    "samantha/samantha-1.1",
    "gryphe/mythomax-l2-13b",
    "huggingfaceh4/zephyr-7b-alpha"
];


// This is the ideal structure we want from the AI model.
const JSON_PROMPT_STRUCTURE = `
You are an expert SEO article writer. Generate an article based on the topic provided.
The response must be a single, valid JSON object that adheres to the following structure:
{
  "image": "A descriptive prompt for an AI image generator to create a relevant, professional photo for the article. This should be a single, descriptive sentence. For example: 'A glowing brain with intricate neural pathways, representing the art of crafting AI prompts, high detail, vibrant, professional photo'.",
  "dataAiHint": "one or two keywords for an AI image generator to create a relevant image for the article. For example: 'futuristic brain'.",
  "category": "The category of the article, which will be provided.",
  "title": "A compelling, SEO-friendly title for the article, exactly 9 words long.",
  "slug": "The URL-friendly slug for the article, based on the title. For example: 'the-art-of-crafting-compelling-ai-prompts'.",
  "articleContent": [
    { "type": "h2", "content": "A compelling H2 subheading for the first section." },
    { "type": "p", "content": "The first paragraph of the section, around 100-150 words." },
    { "type": "p", "content": "The second paragraph of the section, around 100-150 words." },
    { "type": "h3", "content": "A relevant H3 subheading." },
    { "type": "p", "content": "A paragraph for the H3 subheading, around 100-150 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the second section." },
    { "type": "p", "content": "A paragraph for this section, around 100-150 words." },
    { "type": "p", "content": "Another paragraph for this section, around 100-150 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the third section." },
    { "type": "p", "content": "A paragraph for this section, around 100-150 words." },
    { "type": "p", "content": "Another paragraph for this section, around 100-150 words." },
    { "type": "h2", "content": "A compelling H2 subheading for the fourth section." },
    { "type": "p", "content": "A paragraph for this section, around 100-150 words." },
    { "type": "p", "content": "Another paragraph for this section, around 100-150 words." }
  ],
  "keyTakeaways": [
    "A key takeaway from the article.",
    "Another key takeaway from the article.",
    "A third key takeaway from the article.",
    "A fourth key takeaway from the article."
  ],
  "conclusion": "A compelling concluding paragraph, around 150-200 words, summarizing the article's main points and providing a final thought."
}
Ensure the entire output is a single JSON object. The total word count of the article content and conclusion should be approximately 2000 words.
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
        const articleJson = JSON.parse(data.choices[0].message.content);

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

    if (articles.length === 0) {
        console.warn(`Could not generate any articles for category "${category}".`);
        return;
    }

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);
    await fs.writeFile(filePath, JSON.stringify(articles, null, 2), 'utf-8');
    console.log(`✅ Articles for category "${category}" saved locally to ${filePath}`);

    // Now, save the newly generated file to GitHub
    await saveArticleToGithub(category, JSON.stringify(articles, null, 2));
}

    