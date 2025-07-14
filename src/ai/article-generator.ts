
'use server';

import { z } from 'zod';
import type { Article } from '@/lib/articles';

// Define the structure of an article part (e.g., h2, h3, p)
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
  title: z.string().min(1).describe("A compelling, SEO-friendly title for the article (9-word topic)."),
  slug: z.string().min(1).describe("A URL-friendly slug, generated from the title."),
  articleContent: z.array(ArticleContentBlockSchema).describe("An array of content blocks. The VERY FIRST object must be a 'p' type with a summary of the article. Subsequent H2 headings should be followed by an image block (`{ \"type\": \"img\", \"content\": \"URL\", \"alt\": \"Description\" }`). Generate at least 5 images throughout the article. The total word count should match the user's request."),
  keyTakeaways: z.array(z.string()).describe("An array of 4-5 key takeaways from the article."),
  conclusion: z.string().min(1).describe("A strong, summarizing conclusion for the article."),
});

const getJsonPromptStructure = (wordCount: string, style: string, mood: string) => `
  You are an expert content creator and SEO specialist. Your task is to generate a high-quality, comprehensive, and engaging article about a given topic.

  **CRITICAL INSTRUCTIONS:**
  - The article's total length MUST be approximately **${wordCount} words**.
  - The writing style MUST be **${style}**.
  - The overall mood and tone of the article MUST be **${mood}**.
  - You MUST include at least 5 different, relevant images within the article content. Place an image block after most H2 headings.

  You MUST structure your response as a single, valid JSON object that adheres to the schema provided. Do NOT include any markdown formatting like \`\`\`json \`\`\`.

  Specifically for the "image" and "img" fields, you must create a descriptive and artistic prompt for Pollinations.ai based on the article's topic, and then construct the final URL. For example, if the topic is 'The Future of AI', your image prompt might be 'a glowing brain made of circuits and stars, digital art'. The final URL would then be 'https://image.pollinations.ai/prompt/a%20glowing%20brain%20made%20of%20circuits%20and%20stars%2C%20digital%20art?width=600&height=400&seed=...&nologo=true'. Each 'img' block needs a URL in its 'content' field and a descriptive 'alt' text.

  For the "articleContent", the VERY FIRST object must be a 'p' type with a summary of the article. The rest should be a mix of heading types (h2-h6) and 'p' (paragraph) types to create a well-structured article of the required word count. Paragraphs should be short and easy to read.

  Do not use asterisks for bolding.
`;

interface GenerationParams {
    prompt: string;
    category: string;
    model: string;
    style: string;
    mood: string;
    wordCount: string;
    apiKey?: string; // Optional API key from the user
}

export async function generateArticleForTopic(params: GenerationParams): Promise<Article | null> {
    const { prompt, category, model, style, mood, wordCount, apiKey } = params;

    // Use the user-provided API key if it exists, otherwise fall back to the environment variable.
    const api_key_to_use = apiKey || process.env.OPENROUTER_API_KEY;

    if (!api_key_to_use) {
        throw new Error("OpenRouter API key is not set. Please provide one in the form or set the OPENROUTER_API_KEY environment variable on Vercel.");
    }
    console.log(`Generating article for topic: "${prompt}" in category: "${category}" using model: ${model}`);

    const JSON_PROMPT_STRUCTURE = getJsonPromptStructure(wordCount, style, mood);

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
                    { role: "user", content: `Generate an article for the category "${category}" on the topic: "${prompt}".` }
                ],
                response_format: { type: "json_object" },
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error: ${response.status}`, errorBody);
            throw new Error(`API request failed with status ${response.status}. Please check the model name and your API key.`);
        }

        const data = await response.json();
        const jsonContent = data.choices[0].message.content;

        const rawArticle = JSON.parse(jsonContent);

        // Validate and parse the generated content
        const parsedResult = ArticleOutputSchema.safeParse(rawArticle);

        if (!parsedResult.success) {
            console.error("Zod validation failed:", parsedResult.error.flatten());
            throw new Error("Generated content failed validation. The AI's response did not match the required format.");
        }

        // Add the current date as publishedDate before returning
        const finalArticle: Article = {
            ...parsedResult.data,
            publishedDate: new Date().toISOString(),
        };

        console.log(`- Successfully generated and validated article: "${finalArticle.title}"`);
        return finalArticle;

    } catch (error) {
        console.error(`- Failed to generate article with model ${model}. Error:`, error);
        // Re-throw the error to be caught by the server action
        throw error;
    }
}
