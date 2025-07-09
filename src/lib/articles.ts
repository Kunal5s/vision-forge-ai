
'use server';

import { getContent, saveContent } from './github';

interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    slug: string;
    articleContent: string;
    keyTakeaways: string[];
    conclusion: string;
}

interface GenerationOptions {
    forceRegenerate?: boolean;
}

async function generateSingleArticle(topic: string, category: string): Promise<Article> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key is not configured.');
    }

    const fullPrompt = `You are a world-class content creator and SEO expert. Your task is to generate a comprehensive, well-structured, and human-friendly long-form article. The website this is for is an AI Image Generator. Ensure all content is highly relevant to the provided topic and category.

    **CRITICAL INSTRUCTIONS:**
    1.  **JSON Output Only:** Respond with a single, valid JSON object. Do not include any text, comments, or markdown formatting before or after the JSON.
    2.  **Topic & Category Relevance:** The article MUST be strictly about the provided TOPIC ("${topic}") within the context of the given CATEGORY ("${category}"). Every paragraph should be relevant.
    3.  **Title Constraint:** The "title" MUST be exactly 9 words long. This is a strict requirement.
    4.  **Content Length:** The "articleContent" MUST be approximately 1500 words. It should be detailed, informative, and engaging, structured with clear paragraphs. Use newline characters ('\n') to separate paragraphs.
    5.  **Key Takeaways:** The "keyTakeaways" MUST be an array of exactly 6 concise, insightful, bullet-point style takeaways. Each takeaway must be a string.
    6.  **Image Prompt:** The "imagePrompt" must be a concise, descriptive prompt (10-15 words) for an AI image generator to create a visually appealing and relevant header image for this article.

    **JSON Structure Template:**
    {
      "title": "A catchy, 9-word title about the topic.",
      "articleContent": "The main article body, approx 1500 words, with paragraphs separated by newline characters...",
      "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5", "Takeaway 6"],
      "conclusion": "A strong concluding paragraph summarizing the article.",
      "imagePrompt": "A 10-15 word prompt for an image generator."
    }
    
    Now, generate the content for:
    Topic: "${topic}"
    Category: "${category}"
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        }),
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`Failed to generate content from Google AI: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const aiTextResponse = geminiData.candidates[0]?.content.parts[0]?.text;

    if (!aiTextResponse) {
        throw new Error("Received an empty response from the AI model.");
    }
    
    const articleData = JSON.parse(aiTextResponse);

    const { title, articleContent, keyTakeaways, conclusion, imagePrompt } = articleData;
    
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
                const articles = JSON.parse(existingContent.content);
                if (Array.isArray(articles) && articles.length > 0) {
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
