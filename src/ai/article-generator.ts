
'use server';

import { z } from 'zod';
import type { Article } from '@/lib/articles';
import { OPENROUTER_MODELS } from '@/lib/constants';

// ---- Topic Generation Schemas ----
const TopicSuggestionInputSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters long.'),
});

const TopicSuggestionOutputSchema = z.object({
  topics: z.array(z.string()).length(5).describe("An array of 5 compelling, SEO-friendly, 9-word article titles based on the user's prompt."),
});

// ---- Article Generation Schemas ----
const ArticleContentBlockSchema = z.object({
  type: z.enum(['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img']),
  content: z.string().min(1),
  alt: z.string().optional(),
});


// Define the overall structure of a single article
const ArticleOutputSchema = z.object({
  image: z.string().url().describe("URL for a relevant, high-quality image from Pollinations.ai. The prompt for the image should be creative and directly related to the article's core theme. The URL structure is `https://image.pollinations.ai/prompt/{PROMPT}?width=600&height=400&seed={RANDOM_SEED}&nologo=true`."),
  dataAiHint: z.string().describe("A two-word string describing the image for AI hint purposes."),
  category: z.string().describe("The category of the article."),
  title: z.string().min(1).describe("The compelling, SEO-friendly title for the article."),
  slug: z.string().min(1).describe("A URL-friendly slug, generated from the title."),
  articleContent: z.array(ArticleContentBlockSchema).describe("An array of content blocks. The VERY FIRST object must be a 'p' type with a summary of the article. Subsequent H2 headings should be followed by an image block (`{ \"type\": \"img\", \"content\": \"URL\", \"alt\": \"Description\" }`). Generate the specified number of images throughout the article. The total word count should match the user's request. **IMPORTANT: For all 'p', 'h2', 'h3' etc. blocks, the 'content' string MUST include rich HTML formatting like <strong> for bold, <em> for italic, and <u> for underline where appropriate to make the article engaging.**"),
  keyTakeaways: z.array(z.string()).describe("An array of 4-5 key takeaways from the article."),
  conclusion: z.string().min(1).describe("A strong, summarizing conclusion for the article. **This conclusion MUST also be formatted with HTML tags like <strong> and <em> for emphasis.**"),
});

const getJsonPromptStructureForArticle = (wordCount: string, style: string, mood: string, imageCount: string) => `
  You are an expert content creator and SEO specialist. Your task is to generate a high-quality, comprehensive, and engaging article about a given topic.

  **CRITICAL INSTRUCTIONS:**
  - The article's total length MUST be approximately **${wordCount} words**.
  - The writing style MUST be **${style}**.
  - The overall mood and tone of the article MUST be **${mood}**.
  - You MUST include exactly **${imageCount}** different, relevant images within the article content. Place an image block after most H2 headings.

  **FORMATTING INSTRUCTIONS:**
  - For all text-based content within the JSON (like 'title', 'content' for 'p' and 'h' tags, 'keyTakeaways', and 'conclusion'), you MUST embed appropriate HTML tags for rich formatting.
  - Use <strong> for bolding important keywords and phrases.
  - Use <em> for emphasizing points with italics.
  - Use <u> for underlining where it makes sense stylistically.
  - This ensures the generated article is not plain text, but a fully formatted, publish-ready piece of content.

  You MUST structure your response as a single, valid JSON object that adheres to the schema provided. Do NOT include any markdown formatting like \`\`\`json \`\`\`.

  Specifically for the "image" and "img" fields, you must create a descriptive and artistic prompt for Pollinations.ai based on the article's topic, and then construct the final URL. For example, if the topic is 'The Future of AI', your image prompt might be 'a glowing brain made of circuits and stars, digital art'. The final URL would then be 'https://image.pollinations.ai/prompt/a%20glowing%20brain%20made%20of%20circuits%20and%20stars%2C%20digital%20art?width=600&height=400&seed=...&nologo=true'. Each 'img' block needs a URL in its 'content' field and a descriptive 'alt' text.

  For the "articleContent", the VERY FIRST object must be a 'p' type with a summary of the article. The rest should be a mix of heading types (h2-h6) and 'p' (paragraph) types to create a well-structured article of the required word count. Paragraphs should be short and easy to read.
`;


interface TopicGenerationParams {
    prompt: string;
    apiKey?: string;
}

export async function generateTopics(params: TopicGenerationParams): Promise<string[] | null> {
    const { prompt, apiKey } = params;
    const api_key_to_use = apiKey || process.env.OPENROUTER_API_KEY;

    if (!api_key_to_use) {
        throw new Error("OpenRouter API key is not set.");
    }
    
    // Using a reliable model for this specific, structured task
    const model = "google/gemma-2-9b-it";
    const TOPIC_PROMPT = `Based on the user's idea, generate an array of 5 unique, compelling, and SEO-friendly article titles. Each title must be exactly 9 words long. Respond with a JSON object: { "topics": ["topic1", "topic2", ...] }`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${api_key_to_use}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: TOPIC_PROMPT },
                    { role: "user", content: `Generate topics for this idea: "${prompt}".` }
                ],
                response_format: { type: "json_object" },
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error with model ${model} for topic generation: ${response.status}`, errorBody);
            throw new Error('Failed to generate topics from AI.');
        }

        const data = await response.json();
        const jsonContent = data.choices[0].message.content;
        const parsedResult = TopicSuggestionOutputSchema.safeParse(JSON.parse(jsonContent));

        if (!parsedResult.success) {
            console.warn(`Zod validation failed for topic generation:`, parsedResult.error.flatten());
            throw new Error('AI generated invalid topic format.');
        }

        return parsedResult.data.topics;
    } catch (error) {
        console.error(`- An unexpected error occurred during topic generation. Error:`, error);
        throw error; // Re-throw the error to be handled by the action
    }
}


interface ArticleGenerationParams {
    topic: string; // The selected topic is now the main prompt
    category: string;
    model: string;
    style: string;
    mood: string;
    wordCount: string;
    imageCount: string;
    apiKey?: string;
}

export async function generateArticleForTopic(params: ArticleGenerationParams): Promise<Article | null> {
    const { topic, category, style, mood, wordCount, imageCount, apiKey } = params;
    let preferredModel = params.model;

    const api_key_to_use = apiKey || process.env.OPENROUTER_API_KEY;

    if (!api_key_to_use) {
        throw new Error("OpenRouter API key is not set. Please provide one in the form or set the OPENROUTER_API_KEY environment variable on Vercel.");
    }
    
    const modelsToTry = [preferredModel, ...OPENROUTER_MODELS.filter(m => m !== preferredModel)];
    const JSON_PROMPT_STRUCTURE = getJsonPromptStructureForArticle(wordCount, style, mood, imageCount);
    
    for (const model of modelsToTry) {
        console.log(`Attempting to generate article for topic: "${topic}" in category: "${category}" using model: ${model}`);
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${api_key_to_use}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: JSON_PROMPT_STRUCTURE },
                        { role: "user", content: `Generate an article for the category "${category}" on the topic: "${topic}".` }
                    ],
                    response_format: { type: "json_object" },
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.warn(`API Error with model ${model}: ${response.status}`, errorBody);
                continue; 
            }

            const data = await response.json();
            const jsonContent = data.choices[0].message.content;

            const rawArticle = JSON.parse(jsonContent);
            const parsedResult = ArticleOutputSchema.safeParse(rawArticle);

            if (!parsedResult.success) {
                console.warn(`Zod validation failed for model ${model}:`, parsedResult.error.flatten());
                continue;
            }

            const finalArticle: Article = {
                ...parsedResult.data,
                publishedDate: new Date().toISOString(),
            };

            console.log(`- Successfully generated and validated article: "${finalArticle.title}" with model: ${model}`);
            return finalArticle;

        } catch (error) {
            console.error(`- An unexpected error occurred with model ${model}. Trying next model. Error:`, error);
        }
    }

    throw new Error('All AI models failed to generate the article. Please check your API key, the complexity of the topic, or try again later.');
}
