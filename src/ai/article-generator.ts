'use server';

import { z } from 'zod';
import { Article, ArticleContentBlock, ArticleSchema } from '@/lib/articles';

// Define the structure of an article part (e.g., h2, h3, p)
const ArticleContentBlockSchema = z.object({
  type: z.enum(['h2', 'h3', 'h4', 'h5', 'h6', 'p']),
  content: z.string().min(1),
});

// Define the overall structure of a single article
const ArticleOutputSchema = z.object({
  image: z.string().url().describe("URL for a relevant, high-quality image from Pollinations.ai. The prompt should be creative and related to the article's theme. URL structure: `https://image.pollinations.ai/prompt/{PROMPT}?width=600&height=400&seed={RANDOM_SEED}&nologo=true`"),
  dataAiHint: z.string().describe("A two-word string describing the image for AI hint purposes."),
  category: z.string().describe("The category of the article."),
  title: z.string().min(1).describe("A compelling, SEO-friendly title for the article (9-word topic)."),
  slug: z.string().min(1).describe("A URL-friendly slug, generated from the title."),
  articleContent: z.array(ArticleContentBlockSchema).describe("An array of content blocks. The VERY FIRST object must be a 'p' type with a 200-word summary of the article. The rest should be a well-structured mix of headings (h2-h6) and paragraphs (p)."),
  keyTakeaways: z.array(z.string()).describe("An array of 4-5 key takeaways from the article."),
  conclusion: z.string().min(1).describe("A strong, summarizing conclusion for the article."),
});

// --- OPENROUTER & MODEL CONFIGURATION ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// A powerful model for this task. We can add more later.
const GENERATION_MODEL = "nousresearch/nous-hermes-2-mixtral-8x7b-dpo";

const JSON_PROMPT_STRUCTURE = `
  You are an expert content creator and SEO specialist. Your task is to generate a high-quality, comprehensive, and engaging article about a given topic. The article must be approximately 3500 words long.
  You MUST structure your response as a single, valid JSON object that adheres to the schema provided. Do NOT include any markdown formatting like \`\`\`json \`\`\`.
  Your writing style should be authoritative, insightful, and accessible to a broad audience, using natural human tones and emotions. Do not use asterisks for bolding.
`;

export async function generateArticleForTopic(category: string, topic: string): Promise<Article | null> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set.");
    }
    console.log(`Generating article for topic: "${topic}" in category: "${category}"`);

    try {
        console.log(`- Using model: ${GENERATION_MODEL}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: GENERATION_MODEL,
                messages: [
                    { role: "system", content: JSON_PROMPT_STRUCTURE },
                    { role: "user", content: `Generate an article for the category "${category}" on the topic: "${topic}".` }
                ],
                response_format: { type: "json_object" },
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error: ${response.status}`, errorBody);
            throw new Error(`API request failed with status ${response.status}.`);
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
        console.error(`- Failed to generate article with model ${GENERATION_MODEL}. Error:`, error);
        return null;
    }
}
