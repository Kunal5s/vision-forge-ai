
import { getContent, saveContent } from './github';

interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
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

    const fullPrompt = `You are an expert content creator and SEO specialist. Your task is to generate a detailed, well-structured, and human-friendly long-form article based on the topic provided.

    IMPORTANT: Respond with a single, valid JSON object only, with no other text, comments, or markdown formatting before or after it.
    
    The JSON object must have the following keys:
    - "title": A catchy, human-friendly title for the article. It MUST be exactly 9 words long.
    - "articleContent": The main body of the article, written in a helpful and engaging tone. It MUST be a well-structured text of approximately 1500 words. Use paragraphs to structure the content.
    - "keyTakeaways": An array of exactly 6 concise, bullet-point style key takeaways from the article. Each takeaway MUST be a string.
    - "conclusion": A strong concluding paragraph that summarizes the article's main points.
    - "imagePrompt": A concise, descriptive prompt for an image generator to create a relevant, visually appealing image for this article. Should be around 10-15 words.
    
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
    
    // Generate image using Pollinations.ai
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
                // Basic validation
                if (Array.isArray(articles) && articles.length > 0) {
                    console.log(`Found existing articles for category: ${category}`);
                    return articles;
                }
            } catch(e) {
                console.error(`Error parsing existing articles for ${category}, will regenerate.`, e);
            }
        }
    }

    console.log(`Generating new articles for category: ${category}`);
    const articlePromises = topics.map(topic => generateSingleArticle(topic, category));
    const newArticles = await Promise.all(articlePromises);

    const existingFile = await getContent(filePath); // Check again in case it was created during generation
    await saveContent(
        filePath,
        JSON.stringify(newArticles, null, 2),
        `feat: update articles for ${category}`,
        existingFile?.sha
    );

    return newArticles;
}
