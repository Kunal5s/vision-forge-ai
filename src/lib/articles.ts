
'use server';

import fs from 'fs/promises';
import path from 'path';
import { Octokit } from 'octokit';
import { z } from 'zod';

// Define the structure of an article part (e.g., h2, h3, p)
const ArticleContentBlockSchema = z.object({
  type: z.enum(['h2', 'h3', 'h4', 'h5', 'h6', 'p']),
  content: z.string().min(1),
});
export type ArticleContentBlock = z.infer<typeof ArticleContentBlockSchema>;

// Define the overall structure of a single article
const ArticleSchema = z.object({
  image: z.string().url(),
  dataAiHint: z.string(),
  category: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  publishedDate: z.string().datetime().optional(), // Make date optional for older articles
  articleContent: z.array(ArticleContentBlockSchema),
  keyTakeaways: z.array(z.string()),
  conclusion: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

// Define the structure of the JSON file (an array of articles)
const ArticleFileSchema = z.array(ArticleSchema);

// --- OPENROUTER & MODEL CONFIGURATION ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODELS = [
  "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
  "mistralai/mistral-7b-instruct",
  "huggingfaceh4/zephyr-7b-beta",
  "openai/gpt-3.5-turbo",
  "google/gemini-pro",
  "anthropic/claude-2",
];

const JSON_PROMPT_STRUCTURE = `
  You are an expert content creator and SEO specialist. Your task is to generate a high-quality, comprehensive, and engaging article about a given topic. The article must be approximately 3500 words long.

  You MUST structure your response as a single, valid JSON object that adheres to the ArticleSchema. Do NOT include any markdown formatting like \`\`\`json \`\`\`.

  The JSON object must have the following properties:
  - "image": A string containing a URL for a relevant, high-quality image. Generate this using Pollinations.ai. The prompt for the image should be creative and directly related to the article's core theme. The URL structure is \`https://image.pollinations.ai/prompt/{PROMPT}?width=600&height=400&seed={RANDOM_SEED}&nologo=true\`.
  - "dataAiHint": A two-word string describing the image for AI hint purposes.
  - "category": The category of the article, which will be provided.
  - "title": A compelling, SEO-friendly title for the article (9-word topic).
  - "slug": A URL-friendly slug, generated from the title (e.g., 'the-new-realism-how-ai-is-redefining-photography').
  - "publishedDate": The current date and time in ISO 8601 format (e.g., "2024-07-29T12:00:00.000Z").
  - "articleContent": An array of objects, where each object represents a block of content. The VERY FIRST object must be a 'p' type with a 200-word summary of the article. The rest should be a mix of heading types (H2, H3, H4, H5, H6) and 'p' (paragraph) types. The article must be well-structured with multiple H2 and H3 headings. Ensure a logical flow and in-depth exploration of the topic. Paragraphs should be short and easy to read.
  - "keyTakeaways": An array of 4-5 strings, each being a key takeaway from the article.
  - "conclusion": A strong, summarizing conclusion for the article.

  Your writing style should be authoritative, insightful, and accessible to a broad audience, using natural human tones and emotions. Do not use asterisks for bolding.
`;

const articleCache = new Map<string, Article[]>();

export async function getArticles(category: string): Promise<Article[]> {
    const cacheKey = category;
    if (articleCache.has(cacheKey)) {
        return articleCache.get(cacheKey)!;
    }

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);

    try {
        await fs.access(filePath);
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
            console.log(`No local articles file found for "${category}". An empty array will be used.`);
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}

// Function to clean markdown bolding from a string
const cleanMarkdownBold = (text: string): string => {
    // This regex finds **word** or *word* and replaces it with <strong>word</strong>
    return text.replace(/\*{1,2}(.*?)\*{1,2}/g, '<strong>$1</strong>');
};

// Function to generate a single article using a rotating list of models
async function generateArticleForTopic(category: string, topic: string, retries = MODELS.length): Promise<Article | null> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set.");
    }
    console.log(`Attempting to generate article for topic: "${topic}" in category: "${category}"`);

    for (let i = 0; i < MODELS.length; i++) {
        const model = MODELS[i];
        try {
            console.log(`- Using model: ${model} (Attempt ${i + 1}/${MODELS.length})`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
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
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            const jsonContent = data.choices[0].message.content;
            
            // Add a publishedDate if the model didn't include it.
            const rawArticle = JSON.parse(jsonContent);
            if (!rawArticle.publishedDate) {
                rawArticle.publishedDate = new Date().toISOString();
            }

            // ** Clean the content before validation **
            rawArticle.conclusion = cleanMarkdownBold(rawArticle.conclusion);
            rawArticle.articleContent.forEach((block: ArticleContentBlock) => {
                block.content = cleanMarkdownBold(block.content);
            });


            // Validate the received JSON against our Zod schema
            const parsedArticle = ArticleSchema.safeParse(rawArticle);

            if (parsedArticle.success) {
                console.log(`  - Successfully generated and validated article: "${parsedArticle.data.title}"`);
                return parsedArticle.data;
            } else {
                console.error("  - Zod validation failed:", parsedArticle.error.flatten());
                // The structure was wrong, so we treat it as a failure and try the next model.
                throw new Error("Generated content failed Zod validation.");
            }

        } catch (error) {
            console.error(`  - Failed to generate article with model ${model}. Error:`, error);
            if (i === MODELS.length - 1) {
                // This was the last model, so we fail permanently for this topic.
                console.error(`All models failed for topic: "${topic}".`);
                return null;
            }
            // Otherwise, the loop will continue to the next model.
        }
    }
    return null; // Should not be reached, but for type safety
}

async function getShaForFile(octokit: Octokit, owner: string, repo: string, path: string): Promise<string | undefined> {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
        });
        if (Array.isArray(data) || !('sha' in data)) {
            return undefined;
        }
        return data.sha;
    } catch (error: any) {
        if (error.status === 404) {
            return undefined; // File doesn't exist
        }
        throw error;
    }
}

// Main function to generate and save articles for a given category
export async function generateAndSaveArticles(category: string, topics: string[]) {
    console.log(`Starting article generation process for category: ${category}`);
    
    const generationPromises = topics.map(topic => generateArticleForTopic(category, topic));
    const newArticles = (await Promise.all(generationPromises)).filter((article): article is Article => article !== null);

    if (newArticles.length === 0) {
        console.error(`Could not generate any new articles for category: ${category}. Aborting save.`);
        return;
    }

    // Always read the existing articles to append, not overwrite.
    const existingArticles = await getArticles(category);
    const updatedArticles = [...newArticles, ...existingArticles]; // Prepend the new articles

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);
    const fileContent = JSON.stringify(updatedArticles, null, 2);

    // Save to local file system
    await fs.writeFile(filePath, fileContent, 'utf-8');
    console.log(`Successfully saved ${updatedArticles.length} articles locally to ${filePath}`);
    
    // --- GitHub Integration ---
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;

    if (GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME) {
        try {
            const octokit = new Octokit({ auth: GITHUB_TOKEN });
            const repoPath = `src/articles/${categorySlug}.json`;
            const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath);
            
            await octokit.rest.repos.createOrUpdateFileContents({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                path: repoPath,
                message: `feat: ✨ Add ${newArticles.length} new articles to ${category}`,
                content: Buffer.from(fileContent).toString('base64'),
                sha: fileSha,
            });
            console.log(`Successfully committed updated articles for "${category}" to GitHub.`);
        } catch (error) {
            console.error("Failed to commit changes to GitHub. The local file was saved.", error);
        }
    } else {
        console.log("GitHub credentials not set. Skipping commit.");
    }

    // Invalidate local cache after update
    articleCache.delete(category);
}
