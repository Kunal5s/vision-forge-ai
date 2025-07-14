
'use server';

import fs from 'fs/promises';
import path from 'path';
import { Octokit } from 'octokit';
import { z } from 'zod';

const ArticleContentBlockSchema = z.object({
  type: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img']),
  content: z.string(),
  alt: z.string().optional(),
});
export type ArticleContentBlock = z.infer<typeof ArticleContentBlockSchema>;

const ArticleSchema = z.object({
  image: z.string().url(),
  dataAiHint: z.string(),
  category: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  publishedDate: z.string().datetime().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
  keyTakeaways: z.array(z.string()),
  conclusion: z.string().min(1),
});
export type Article = z.infer<typeof ArticleSchema>;

const ArticleFileSchema = z.array(ArticleSchema);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODELS = [
    "qwen/qwen-2-72b-instruct",
    "meta-llama/llama-3-70b-instruct",
    "mistralai/mixtral-8x22b-instruct",
    "google/gemma-2-27b-it",
    "anthropic/claude-3.5-sonnet",
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
  - "articleContent": An array of objects. The VERY FIRST object must be a 'p' type with a 200-word summary of the article. Subsequent H2 headings should be followed by an image block (\`{ "type": "img", "content": "URL", "alt": "Description" }\`). Generate at least 5 images throughout the article. The total word count should be ~3500 words.
  - "keyTakeaways": An array of 4-5 strings, each being a key takeaway from the article.
  - "conclusion": A strong, summarizing conclusion for the article.

  Your writing style should be authoritative, insightful, and accessible to a broad audience, using natural human tones and emotions. DO NOT use Markdown like ** for bolding.
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
        const articlesData = JSON.parse(fileContent);

        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            articleCache.set(cacheKey, validatedArticles.data);
            return validatedArticles.data;
        } else {
             console.warn(`Zod validation failed for ${categorySlug}.json.`, validatedArticles.error.flatten());
             return [];
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log(`No local articles file found for "${category}". An empty array will be used.`);
        } else {
            console.error(`Error reading or parsing articles for category "${category}":`, error);
        }
        return [];
    }
}


// Function to generate a single article using a rotating list of models
async function generateArticleForTopic(category: string, topic: string): Promise<Article | null> {
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
            
            const rawArticle = JSON.parse(jsonContent);
            
            const parsedArticle = ArticleSchema.safeParse(rawArticle);

            if (parsedArticle.success) {
                console.log(`  - Successfully generated and validated article: "${parsedArticle.data.title}"`);
                return { ...parsedArticle.data, publishedDate: new Date().toISOString() };
            } else {
                console.error("  - Zod validation failed:", parsedArticle.error.flatten());
                throw new Error("Generated content failed Zod validation.");
            }

        } catch (error) {
            console.error(`  - Failed to generate article with model ${model}. Error:`, error);
            if (i === MODELS.length - 1) {
                console.error(`All models failed for topic: "${topic}".`);
                return null;
            }
        }
    }
    return null;
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
            return undefined; 
        }
        throw error;
    }
}

export async function generateAndSaveArticles(category: string, topics: string[]) {
    console.log(`Starting article generation process for category: ${category}`);
    
    const generationPromises = topics.map(topic => generateArticleForTopic(category, topic));
    const newArticles = (await Promise.all(generationPromises)).filter((article): article is Article => article !== null);

    if (newArticles.length === 0) {
        console.error(`Could not generate any new articles for category: ${category}. Aborting save.`);
        return;
    }

    const existingArticles = await getArticles(category);
    const updatedArticles = [...newArticles, ...existingArticles]; 

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(process.cwd(), 'src', 'articles', `${categorySlug}.json`);
    const fileContent = JSON.stringify(updatedArticles, null, 2);

    await fs.writeFile(filePath, fileContent, 'utf-8');
    console.log(`Successfully saved ${updatedArticles.length} articles locally to ${filePath}`);
    
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

    articleCache.delete(category);
}
