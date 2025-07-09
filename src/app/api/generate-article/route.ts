
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// The expected structure of the JSON output from the AI model
interface ArticleAIResponse {
    category: string;
    title: string;
    description: string;
    imagePrompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = (await req.json()) as { topic: string };

    if (!topic) {
      const message = 'Topic is required';
      return NextResponse.json({ error: message, details: message }, { status: 400 });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const message = 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.';
        return NextResponse.json({ error: message, details: message }, { status: 500 });
    }

    const prompt = `You are an expert content creator. Your task is to generate a human-friendly and helpful article concept based on the topic provided.
    
    IMPORTANT: Respond with a single, valid JSON object only, with no other text, comments, or markdown formatting before or after it.
    
    The JSON object must have the following keys:
    - "category": A single-word category for the article (e.g., "Technology", "Creativity", "Business").
    - "title": A catchy, human-friendly title for the article, 5-8 words long.
    - "description": A short, helpful description for the article, around 20-30 words long.
    - "imagePrompt": A concise, descriptive prompt for an image generator (like DALL-E or Midjourney) to create a relevant, visually appealing image for this article. Should be around 10-15 words.

    Topic: "${topic}"
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
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
    
    // The model should return clean JSON because of the prompt and mime type config.
    const articleData: ArticleAIResponse = JSON.parse(aiTextResponse);

    const { category, title, description, imagePrompt } = articleData;
    
    // Generate image using Pollinations.ai
    const width = 600;
    const height = 400;
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const finalImagePrompt = `${imagePrompt}, ${category}, high detail, vibrant, professional photo`;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalImagePrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const dataAiHint = imagePrompt.split(' ').slice(0, 2).join(' ');

    const output = {
      image: pollinationsUrl,
      dataAiHint: dataAiHint,
      category,
      title,
      description,
    };

    return NextResponse.json(output);

  } catch (err: any) {
    console.error('[API_GENERATE_ARTICLE_ERROR]', err);
    return NextResponse.json(
      { error: 'Article generation failed', details: err.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
