
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
  - For all text-based content within the JSON (like 'title', 'content' for 'p' and 'h' tags, 'keyTakeaways', and 'conclusion'), you MUST embed appropriate HTML tags for rich formatting.
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
    provider: 'openrouter' | 'sambanova';
    model: string;
    style: string;
    mood: string;
    wordCount: string;
    imageCount: string;
    openRouterApiKey?: string;
    sambaNovaApiKey?: string;
}

const getApiClient = (provider: 'openrouter' | 'sambanova', apiKey?: string): OpenAI => {
    if (provider === 'openrouter') {
        const finalApiKey = apiKey || process.env.OPENROUTER_API_KEY;
        if (!finalApiKey) {
            throw new Error("OpenRouter API key is not set. Please provide one in the UI or set the OPENROUTER_API_KEY environment variable.");
        }
        return new OpenAI({
            apiKey: finalApiKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "X-Title": "Imagen BrainAi",
            },
        });
    } else { // provider === 'sambanova'
        const finalApiKey = apiKey || process.env.SAMBANOVA_API_KEY;
        if (!finalApiKey) {
            throw new Error("SambaNova API key is not set. Please provide one in the UI or set the SAMBANOVA_API_KEY environment variable.");
        }
        return new OpenAI({
            apiKey: 'EMPTY', // This is ignored when we set the Authorization header
            baseURL: "https://api.cloud.sambanova.ai/v1",
            defaultHeaders: {
                Authorization: `Bearer ${finalApiKey}`,
            },
        });
    }
};

export async function generateArticleForTopic(params: ArticleGenerationParams): Promise<Article | null> {
    const { 
        topic, 
        category, 
        provider, 
        model: preferredModel, 
        style, 
        mood, 
        wordCount, 
        imageCount, 
        openRouterApiKey,
        sambaNovaApiKey 
    } = params;
    
    // Correctly select the API key based on the provider, then create the client
    const clientApiKey = provider === 'openrouter' ? openRouterApiKey : sambaNovaApiKey;
    const client = getApiClient(provider, clientApiKey);

    const availableModels = provider === 'openrouter' ? OPENROUTER_MODELS : SAMBANOVA_MODELS;
    
    // Create a prioritized list of models to try, starting with the user's preferred model
    const modelsToTry = [preferredModel, ...availableModels.filter(m => m !== preferredModel)];
    const JSON_PROMPT_STRUCTURE = getJsonPromptStructureForArticle(wordCount, style, mood, imageCount);
    
    for (const model of modelsToTry) {
        console.log(`Attempting to generate article for topic: "${topic}" in category: "${category}" using provider: ${provider} and model: ${model}`);
        try {
            const response = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: JSON_PROMPT_STRUCTURE },
                    { role: "user", content: `Generate an article for the category "${category}" on the topic: "${topic}".` }
                ],
                response_format: { type: "json_object" },
                max_tokens: 4096, // Increased max tokens for safety with long articles
            });

            const jsonContent = response.choices[0].message.content;
            
            if (!jsonContent) {
                console.warn(`Model ${model} from ${provider} returned empty content.`);
                continue; // Try the next model
            }

            const rawArticle = JSON.parse(jsonContent);
            const parsedResult = ArticleOutputSchema.safeParse(rawArticle);

            if (!parsedResult.success) {
                console.warn(`Zod validation failed for model ${model} from ${provider}:`, parsedResult.error.flatten());
                continue; // Try the next model
            }

            const finalArticle: Article = {
                ...parsedResult.data,
                publishedDate: new Date().toISOString(),
            };

            console.log(`- Successfully generated and validated article: "${finalArticle.title}" with provider: ${provider}, model: ${model}`);
            return finalArticle;

        } catch (error) {
            console.error(`- An unexpected error occurred with provider ${provider} and model ${model}. Trying next model. Error:`, error);
            // The loop will automatically continue to the next model
        }
    }

    // If all models in the list fail
    throw new Error(`All AI models for provider ${provider} failed to generate the article. Please check your API key, the complexity of the topic, or try again later.`);
}

export async function humanizeTextAction(text: string): Promise<{ success: boolean; humanizedText?: string; error?: string }> {
  if (!text || text.trim().length === 0) {
    return { success: false, error: "No text provided to humanize." };
  }

  // Use the OpenRouter key by default, assuming it's the most common one configured.
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenRouter API key is not configured on the server." };
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "X-Title": "Imagen BrainAi",
    },
  });

  try {
    const response = await client.chat.completions.create({
      model: "google/gemma-2-9b-it", // A good, fast model for editing tasks
      messages: [
        {
          role: "system",
          content: "You are an expert editor. Rewrite the following text to be more human-like, engaging, and conversational. Correct any grammar or spelling mistakes. Only return the rewritten text, with no extra commentary.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      top_p: 1,
    });

    const humanizedText = response.choices[0].message.content;
    if (!humanizedText) {
      throw new Error("AI returned an empty response.");
    }

    return { success: true, humanizedText };

  } catch (error) {
    console.error("Error in humanizeTextAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while humanizing the text.";
    return { success: false, error: errorMessage };
  }
}

    