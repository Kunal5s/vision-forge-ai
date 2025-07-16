
'use server';

import { z } from 'zod';
import type { Article } from '@/lib/articles';
import { OPENROUTER_MODELS, SAMBANOVA_MODELS } from '@/lib/constants';
import OpenAI from 'openai';

// Define the overall structure of a single article
const ArticleOutputSchema = z.object({
  image: z.string().url().describe("URL for a relevant, high-quality image from Pollinations.ai. The prompt for the image should be creative and directly related to the article's core theme. The URL structure is `https://image.pollinations.ai/prompt/{PROMPT}?width=600&height=400&seed={RANDOM_SEED}&nologo=true`."),
  dataAiHint: z.string().describe("A two-word string describing the image for AI hint purposes."),
  category: z.string().describe("The category of the article."),
  title: z.string().min(1).describe("The compelling, SEO-friendly title for the article."),
  slug: z.string().min(1).describe("A URL-friendly slug, generated from the title."),
  summary: z.string().min(1).describe("A concise, engaging summary of the article, around 2-3 sentences long. This will be displayed prominently at the top."),
  articleContent: z.array(z.object({
    type: z.enum(['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img']),
    content: z.string().min(1),
    alt: z.string().optional(),
  })).describe("An array of content blocks. The VERY FIRST object must be a 'p' type with a summary of the article. Subsequent H2 headings should be followed by an image block (`{ \"type\": \"img\", \"content\": \"URL\", \"alt\": \"Description\" }`). Generate the specified number of images throughout the article. The total word count should match the user's request. **IMPORTANT: For all 'p', 'h2', 'h3' etc. blocks, the 'content' string MUST include rich HTML formatting like <strong> for bold, <em> for italic, and <u> for underline where appropriate to make the article engaging.**"),
  keyTakeaways: z.array(z.string()).describe("An array of 4-5 key takeaways from the article."),
  conclusion: z.string().min(1).describe("A strong, summarizing conclusion for the article. **This conclusion MUST also be formatted with HTML tags like <strong> and <em> for emphasis.**"),
});

const getJsonPromptStructureForArticle = (wordCount: string, style: string, mood: string, imageCount: string) => `
  You are an expert content creator and SEO specialist. Your task is to generate a high-quality, comprehensive, and engaging article about a given topic. The article structure must include H1, H2, H3, H4, H5 and H6 subheadings where appropriate for a well-organized and deep article.

  **CRITICAL INSTRUCTIONS:**
  - The article's total length MUST be approximately **${wordCount} words**.
  - The writing style MUST be **${style}**.
  - The overall mood and tone of the article MUST be **${mood}**.
  - You MUST include exactly **${imageCount}** different, relevant images within the article content. Place an image block after most H2 headings.
  - You MUST write in a human-like, conversational, and engaging tone. Use storytelling techniques, personal anecdotes (where appropriate), and a natural narrative flow. Avoid robotic language and overly formal structures. The goal is to create content that resonates emotionally with the reader and feels like it was written by an expert human author.

  **FORMATTING INSTRUCTIONS:**
  - For all text-based content within the JSON (like 'title', 'summary', 'content' for 'p' and 'h' tags, 'keyTakeaways', and 'conclusion'), you MUST embed appropriate HTML tags for rich formatting.
  - Use <strong> for bolding important keywords and phrases.
  - Use <em> for emphasizing points with italics.
  - Use <u> for underlining where it makes sense stylistically.
  - This ensures the generated article is not plain text, but a fully formatted, publish-ready piece of content.

  You MUST structure your response as a single, valid JSON object that adheres to the schema provided. Do NOT include any markdown formatting like \`\`\`json \`\`\`.

  Specifically for the "image" and "img" fields, you must create a descriptive and artistic prompt for Pollinations.ai based on the article's topic, and then construct the final URL. For example, if the topic is 'The Future of AI', your image prompt might be 'a glowing brain made of circuits and stars, digital art'. The final URL would then be 'https://image.pollinations.ai/prompt/a%20glowing%20brain%20made%20of%20circuits%20and%20stars%2C%20digital%20art?width=600&height=400&seed=...&nologo=true'. Each 'img' block needs a URL in its 'content' field and a descriptive 'alt' text.

  For the "articleContent", the VERY FIRST object must be a 'p' type with a summary of the article. The rest should be a mix of heading types (h2-h6) and 'p' (paragraph) types to create a well-structured article of the required word count. Paragraphs should be short and easy to read.
`;

interface ArticleGenerationParams {
    topic: string;
    category: string;
    provider: 'openrouter' | 'sambanova' | 'huggingface';
    model: string;
    style: string;
    mood: string;
    wordCount: string;
    imageCount: string;
    openRouterApiKey?: string;
    sambaNovaApiKey?: string;
    huggingFaceApiKey?: string;
}

// This function is now responsible for correctly initializing the OpenAI client
// based on the provider's specific authentication requirements.
async function makeApiCall(
    provider: 'openrouter' | 'sambanova' | 'huggingface',
    baseURL: string,
    apiKey: string,
    model: string,
    promptStructure: string,
    topic: string,
    category: string
): Promise<Article | null> {
    
    let client: OpenAI;

    if (provider === 'huggingface') {
        // Hugging Face requires a Bearer token in the Authorization header.
        // The apiKey parameter in the OpenAI constructor is not used for auth here.
        client = new OpenAI({
            baseURL,
            apiKey: 'huggingface', // This can be any non-empty string, it's ignored.
            defaultHeaders: {
                "Authorization": `Bearer ${apiKey}`
            },
        });
    } else {
        // OpenRouter and SambaNova use the apiKey parameter for authentication.
        // For OpenRouter, we also add custom headers for tracking.
        const defaultHeaders = provider === 'openrouter' 
            ? { "HTTP-Referer": "https://imagenbrain.ai", "X-Title": "Imagen BrainAi" }
            : undefined;

        client = new OpenAI({
            baseURL,
            apiKey,
            defaultHeaders,
        });
    }
    
    console.log(`Attempting to generate with model: ${model} via ${baseURL}`);
    const response = await client.chat.completions.create({
        model,
        messages: [
            { role: "system", content: promptStructure },
            { role: "user", content: `Generate an article for the category "${category}" on the topic: "${topic}".` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
    });

    const jsonContent = response.choices[0].message.content;
    if (!jsonContent) return null;

    const rawArticle = JSON.parse(jsonContent);
    const parsedResult = ArticleOutputSchema.safeParse(rawArticle);

    if (!parsedResult.success) {
        console.warn(`Zod validation failed for model ${model}:`, parsedResult.error.flatten());
        return null;
    }

    return { ...parsedResult.data, publishedDate: new Date().toISOString() };
}

export async function generateArticleForTopic(params: ArticleGenerationParams): Promise<Article | null> {
    const { topic, category, provider, model, style, mood, wordCount, imageCount } = params;
    
    let baseURL: string;
    let apiKey: string;
    let availableModels: string[];

    const JSON_PROMPT_STRUCTURE = getJsonPromptStructureForArticle(wordCount, style, mood, imageCount);

    switch (provider) {
        case 'huggingface':
            baseURL = "https://api-inference.huggingface.co/v1/chat";
            apiKey = params.huggingFaceApiKey || process.env.HUGGINGFACE_API_KEY!;
            availableModels = ["google/gemma-2-9b-it"];
            break;
        case 'openrouter':
            baseURL = "https://openrouter.ai/api/v1";
            apiKey = params.openRouterApiKey || process.env.OPENROUTER_API_KEY!;
            availableModels = OPENROUTER_MODELS;
            break;
        case 'sambanova':
            baseURL = "https://api.cloud.sambanova.ai/v1";
            apiKey = params.sambaNovaApiKey || process.env.SAMBANOVA_API_KEY!;
            availableModels = SAMBANOVA_MODELS;
            break;
    }

    if (!apiKey) {
        throw new Error(`${provider} API key is not set. Please provide one in the UI or set the appropriate environment variable on the server.`);
    }

    const modelsToTry = [model, ...availableModels.filter(m => m !== model)];
    
    for (const currentModel of modelsToTry) {
        try {
            console.log(`Attempting to generate article for topic: "${topic}" with provider: ${provider} and model: ${currentModel}`);
            const article = await makeApiCall(provider, baseURL, apiKey, currentModel, JSON_PROMPT_STRUCTURE, topic, category);
            
            if (article) {
                console.log(`- Successfully generated and validated article: "${article.title}" with provider: ${provider}, model: ${currentModel}`);
                return article;
            } else {
                console.warn(`Model ${currentModel} from ${provider} returned empty or invalid content. Trying next model.`);
            }

        } catch (error: any) {
            console.error(`- An unexpected error occurred with provider ${provider} and model ${currentModel}. Error Message:`, error.message);
            if (error.response) {
                 try {
                    const errorBody = await error.response.json();
                    console.error('Error Response Body:', JSON.stringify(errorBody, null, 2));
                 } catch (e) {
                    console.error('Error Response (not JSON):', await error.response.text());
                 }
            }
        }
    }

    throw new Error(`All AI models for provider ${provider} failed to generate the article. Please check your API key, the complexity of the topic, or try again later.`);
}
