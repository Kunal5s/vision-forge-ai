
'use server';

import { getContent, saveContent } from './github';

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

// 🎯 Priority models first, as requested by the user.
const PRIORITY_MODELS = [
    "qwen/qwen-2-72b-instruct",
    "meta-llama/llama-3-70b-instruct",
    "databricks/dbrx-instruct",
    "mistralai/mixtral-8x22b-instruct",
    "google/gemini-pro" // Using via OpenRouter
];

// 🔥 Fallback models if priority ones fail.
const FALLBACK_MODELS = [
    "mistralai/mixtral-8x7b-instruct",
    "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
    "openchat/openchat-3.5",
    "huggingfaceh4/zephyr-7b-beta",
    "meta-llama/llama-3-8b-instruct",
    "gryphe/mythomax-l2-13b",
    "qwen/qwen-2-7b-instruct",
    "microsoft/wizardlm-2-8x22b"
];


const JSON_PROMPT_STRUCTURE = `You are a world-class content creator and SEO expert with a special talent for writing in a deeply human, engaging, and emotional tone. Your task is to generate a comprehensive, well-structured, and fully humanized long-form article for an AI Image Generator website.

**Primary Goal:** The article must be original, creative, helpful, and written in a tone that feels like a warm, exciting, and empowering conversation with a friendly expert.

**Tone and Style - CRITICAL INSTRUCTIONS:**
1.  **Human, Not Robotic:** Your writing MUST be conversational. Use "I," "you," and "we" to build a direct connection. Paragraphs MUST be very short (1-3 sentences) for easy reading.
2.  **Emotional and Engaging:** Infuse the text with genuine emotion. Use a variety of tones like "Empowering" (e.g., "You have the power to create worlds!"), "Friendly" (e.g., "Hey, let's explore this together! 😄"), "Creative" (e.g., "Imagine a universe painted with light... ✨"), "Motivating" (e.g., "Your next big idea is just one click away."), and "Conversational" (e.g., "Hey! What do you want me to write today?"). Make the reader feel excited and motivated.
3.  **No Jargon:** Explain complex topics in a simple, easy-to-understand way. Avoid technical jargon.

**JSON Structure Template & Rules:**
You MUST respond with a single, valid JSON object. Do not include any text, comments, or markdown before or after the JSON.
{
  "title": "A catchy, 9-word title about the topic.",
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


async function parseAndValidateArticle(aiResponseText: string, topic: string): Promise<Omit<Article, 'image' | 'dataAiHint' | 'slug' | 'category'> & { imagePrompt: string }> {
    let articleData;
    try {
        articleData = JSON.parse(aiResponseText);
    } catch (e) {
        console.error("Failed to parse JSON response from AI for topic:", topic, aiResponseText);
        throw new Error("AI response was not valid JSON.");
    }

    // @ts-ignore
    const { title, articleContent, keyTakeaways, conclusion, imagePrompt } = articleData;

    if (!title || typeof title !== 'string' || title.trim() === '' || !Array.isArray(articleContent) || articleContent.length === 0 || !Array.isArray(keyTakeaways) || !conclusion || !imagePrompt) {
        console.error("Validation failed for AI response on topic:", topic, articleData);
        throw new Error(`AI response for topic "${topic}" is missing required fields or has invalid format.`);
    }

    return { title, articleContent, keyTakeaways, conclusion, imagePrompt };
}


async function generateWithOpenRouter(model: string, topic: string, category: string): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenRouter API key is not configured.');
    }

    console.log(`Using OpenRouter model: ${model} for topic: "${topic}"`);
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
        return openRouterData.choices[0]?.message?.content || null;

    } catch (error) {
        console.warn(`Request to OpenRouter model ${model} failed.`, error);
        return null;
    }
}


async function generateSingleArticle(topic: string, category: string): Promise<Article | null> {
    let aiTextResponse: string | null = null;
    
    const allModels = [...PRIORITY_MODELS, ...FALLBACK_MODELS];

    for (const model of allModels) {
        console.log(`Attempting to generate article for topic "${topic}" with model: ${model}`);
        aiTextResponse = await generateWithOpenRouter(model, topic, category);
        if (aiTextResponse) {
            console.log(`Successfully received response from model: ${model}`);
            break; // Success, move on
        }
    }

    if (!aiTextResponse) {
        throw new Error(`All OpenRouter models failed to generate the article for topic: "${topic}".`);
    }
    
    let parsedData;
    try {
        parsedData = await parseAndValidateArticle(aiTextResponse, topic);
    } catch (validationError) {
        console.error(`Validation failed for generated article on topic "${topic}". Skipping save.`, validationError);
        return null; // Return null if validation fails
    }
    
    const { title, articleContent, keyTakeaways, conclusion, imagePrompt } = parsedData;
    
    const slug = title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    if (!slug) {
        console.error(`Generated an invalid or empty slug for title: "${title}". Skipping article.`);
        return null; // Return null if slug is invalid
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


export async function getArticles(category: string, topics: string[], options: GenerationOptions = {}): Promise<Article[]> {
    const filePath = `articles/${category.toLowerCase().replace(/\s/g, '-')}.json`;

    if (!options.forceRegenerate) {
        const existingContent = await getContent(filePath);
        if (existingContent) {
            try {
                const articles: Article[] = JSON.parse(existingContent.content);
                if (Array.isArray(articles) && articles.length > 0 && articles.every(a => a.slug && a.title)) {
                    console.log(`Found existing articles for category: ${category}`);
                    return articles;
                }
            } catch(e) {
                console.error(`Error parsing existing articles for ${category}, will regenerate.`, e);
            }
        }
    }

    console.log(`Generating new articles for category: ${category} sequentially to avoid rate limiting.`);
    
    const newArticles: Article[] = [];
    for (const topic of topics) {
        try {
            const article = await generateSingleArticle(topic, category);
            if (article) { // Only push valid, non-null articles
                newArticles.push(article);
                console.log(`Successfully generated and validated article for topic: "${topic}"`);
            }
        } catch (error) {
            console.error(`Failed to generate article for topic: "${topic}". Skipping.`, error);
        }
    }
    
    if (newArticles.length > 0) {
        const existingFile = await getContent(filePath);
        await saveContent(
            filePath,
            JSON.stringify(newArticles, null, 2),
            `feat: update articles for ${category}`,
            existingFile?.sha
        );
    }

    return newArticles;
}
