
'use server';

import { getContent, saveContent } from './github';

interface ArticleContentBlock {
    type: 'h2' | 'h3' | 'p';
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

async function generateSingleArticle(topic: string, category: string): Promise<Article> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenRouter API key is not configured.');
    }

    // Select a random model from the list
    const model = FREE_MODELS[Math.floor(Math.random() * FREE_MODELS.length)];
    console.log(`Using OpenRouter model: ${model} for topic: "${topic}"`);

    const fullPrompt = `You are a world-class content creator and SEO expert. Your task is to generate a comprehensive, well-structured, and human-friendly long-form article. The website this is for is an AI Image Generator. Ensure all content is highly relevant to the provided topic and category.

    **JSON Structure Template & Rules:**
    Respond with a single, valid JSON object. Do not include any text, comments, or markdown formatting before or after the JSON.
    {
      "title": "A catchy, 9-word title about the topic.",
      "articleContent": [
        { "type": "h2", "content": "First main heading about the topic." },
        { "type": "p", "content": "A detailed paragraph expanding on the first main heading. It should be engaging and informative." },
        { "type": "h3", "content": "An optional subheading to break down complex points." },
        { "type": "p", "content": "A paragraph related to the subheading." }
      ],
      "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5", "Takeaway 6"],
      "conclusion": "A strong concluding paragraph summarizing the article.",
      "imagePrompt": "A 10-15 word prompt for an image generator."
    }

    **CRITICAL INSTRUCTIONS:**
    1.  **Strict JSON:** The entire output must be a single, valid JSON object.
    2.  **Topic & Category Relevance:** The article MUST be strictly about the provided TOPIC ("${topic}") within the context of the given CATEGORY ("${category}").
    3.  **Title Constraint:** The "title" MUST be exactly 9 words long.
    4.  **articleContent Structure:** The "articleContent" field MUST be an array of objects. Each object must have a "type" ("h2", "h3", or "p") and a "content" (string). Use these to create a well-structured article with multiple headings and paragraphs.
    5.  **Content Length:** The total text across all "content" fields in "articleContent" should be approximately 1500 words.
    6.  **Key Takeaways:** The "keyTakeaways" MUST be an array of exactly 6 concise, insightful, bullet-point style takeaways.
    7.  **Image Prompt:** The "imagePrompt" must be a concise, descriptive prompt (10-15 words) for an AI image generator to create a visually appealing and relevant header image.

    Now, generate the content for:
    Topic: "${topic}"
    Category: "${category}"
    `;

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: fullPrompt }],
            response_format: { type: "json_object" }, // Request JSON output
        }),
    });

    if (!openRouterResponse.ok) {
        const errorBody = await openRouterResponse.text();
        console.error("OpenRouter API Error:", errorBody);
        throw new Error(`Failed to generate content from OpenRouter: ${openRouterResponse.statusText}`);
    }

    const openRouterData = await openRouterResponse.json();
    const aiTextResponse = openRouterData.choices[0]?.message?.content;

    if (!aiTextResponse) {
        throw new Error("Received an empty response from the AI model.");
    }
    
    let articleData;
    try {
        // The response should be a JSON string, so we parse it.
        articleData = JSON.parse(aiTextResponse);
    } catch(e) {
        console.error("Failed to parse JSON response from OpenRouter", aiTextResponse);
        throw new Error("AI response was not valid JSON.");
    }


    const { title, articleContent, keyTakeaways, conclusion, imagePrompt } = articleData;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new Error(`AI response for topic "${topic}" is missing a valid title.`);
    }
    
    const slug = title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

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
                // Basic validation to ensure we have an array of articles with slugs
                if (Array.isArray(articles) && articles.length > 0 && articles.every(a => a.slug)) {
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
            newArticles.push(article);
            console.log(`Successfully generated article for topic: "${topic}"`);
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
