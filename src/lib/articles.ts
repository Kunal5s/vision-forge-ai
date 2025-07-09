
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

const FREE_MODELS = [
    "meta-llama/llama-3-8b-instruct:free",
    "nousresearch/nous-hermes-2-mistral-7b-dpo:free",
    "gryphe/mythomax-l2-13b:free",
    "openchat/openchat-3.5:free",
    "qwen/qwen-2-7b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-7b-it:free",
    "databricks/dbrx-instruct:free",
    "cohere/command-r:free",
    "microsoft/wizardlm-2-8x22b:free"
];

const JSON_PROMPT_STRUCTURE = `You are a world-class content creator and SEO expert with a knack for writing in a deeply human and engaging tone. Your task is to generate a comprehensive, well-structured, and human-friendly long-form article for an AI Image Generator website.

**Primary Goal:** The article must be original, creative, helpful, and written in a tone that feels like a conversation with a friendly expert. It should be fully humanized.

**JSON Structure Template & Rules:**
Respond with a single, valid JSON object. Do not include any text, comments, or markdown formatting before or after the JSON.
{
  "title": "A catchy, 9-word title about the topic.",
  "articleContent": [
    { "type": "h2", "content": "First main heading." },
    { "type": "p", "content": "A short, engaging paragraph." },
    { "type": "h3", "content": "A subheading." },
    { "type": "p", "content": "Another short paragraph." },
    { "type": "h4", "content": "A more specific heading." },
    { "type": "p", "content": "A detailed but concise paragraph." }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5", "Takeaway 6"],
  "conclusion": "A strong concluding paragraph summarizing the article.",
  "imagePrompt": "A 10-15 word prompt for an image generator."
}

**CRITICAL INSTRUCTIONS:**
1.  **Tone & Style:** The writing style MUST be conversational, friendly, and empowering. Use a human tone, incorporating emotions like happiness or excitement where appropriate. Paragraphs MUST be short and easy to read.
2.  **Heading Structure:** The "articleContent" MUST use a logical heading structure, including H2, H3, and H4 tags to break down the topic. Use H5 and H6 for finer details if necessary.
3.  **Content Length & Relevance:** The total text across all "content" fields should be approximately 1500 words. The content must be highly relevant to the TOPIC and CATEGORY provided.
4.  **Title Constraint:** The "title" MUST be exactly 9 words long.
5.  **Key Takeaways:** The "keyTakeaways" array MUST contain exactly 6 concise, insightful bullet-point style takeaways.
6.  **Image Prompt:** The "imagePrompt" must be a concise, descriptive prompt (10-15 words) to create a relevant header image.
7.  **Strict JSON:** The entire output must be a single, valid JSON object.`;


async function parseAndValidateArticle(aiResponseText: string, topic: string): Promise<Omit<Article, 'image' | 'dataAiHint' | 'slug' | 'category'>> {
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


async function generateWithGoogleAI(topic: string, category: string): Promise<any> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key is not configured.');
    }

    const model = 'gemini-1.5-flash';
    console.log(`Using Google AI model: ${model} for topic: "${topic}"`);

    const fullPrompt = `${JSON_PROMPT_STRUCTURE}\n\nNow, generate the content for:\nTopic: "${topic}"\nCategory: "${category}"`;
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
                response_mime_type: "application/json",
            },
        }),
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        console.error("Google AI API Error:", errorBody);
        throw new Error(`Failed to generate content from Google AI: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    return geminiData.candidates[0]?.content?.parts[0]?.text;
}

async function generateWithOpenRouter(topic: string, category: string): Promise<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenRouter API key is not configured.');
    }

    const model = FREE_MODELS[Math.floor(Math.random() * FREE_MODELS.length)];
    console.log(`Using OpenRouter model: ${model} for topic: "${topic}"`);

    const fullPrompt = `${JSON_PROMPT_STRUCTURE}\n\nNow, generate the content for:\nTopic: "${topic}"\nCategory: "${category}"`;

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
        console.error("OpenRouter API Error:", errorBody);
        throw new Error(`Failed to generate content from OpenRouter: ${openRouterResponse.statusText}`);
    }

    const openRouterData = await openRouterResponse.json();
    return openRouterData.choices[0]?.message?.content;
}


async function generateSingleArticle(topic: string, category: string): Promise<Article | null> {
    let aiTextResponse;
    
    try {
        console.log(`Attempting to generate article for topic "${topic}" with Google AI.`);
        aiTextResponse = await generateWithGoogleAI(topic, category);
    } catch (error) {
        console.warn(`Google AI failed for topic "${topic}". Reason:`, error instanceof Error ? error.message : String(error));
        console.log(`Falling back to OpenRouter for topic "${topic}".`);
        try {
            aiTextResponse = await generateWithOpenRouter(topic, category);
        } catch (openRouterError) {
             console.error(`OpenRouter also failed for topic "${topic}".`, openRouterError);
             throw new Error(`Both Google AI and OpenRouter failed to generate the article.`);
        }
    }

    if (!aiTextResponse) {
        throw new Error("Received an empty response from all AI models.");
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
