// src/app/api/generate-article/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// This is the new centralized logic for generating an article via OpenRouter.
// It is designed to be called by server-side functions like those in /src/lib/articles.ts

const PRIORITY_MODELS = [
    "mistralai/mistral-7b-instruct",
    "openchat/openchat-3.5",
    "huggingfaceh4/zephyr-7b-beta"
];

const FALLBACK_MODELS = [
    "meta-llama/llama-3-8b-instruct",
    "gryphe/mythomax-l2-13b",
    "qwen/qwen-2-7b-instruct",
];

const JSON_PROMPT_STRUCTURE = `You are a world-class content creator and SEO expert with a special talent for writing in a deeply human, engaging, and emotional tone. Your task is to generate a comprehensive, well-structured, and fully humanized long-form article for an AI Image Generator website.

**Primary Goal:** The article must be original, creative, helpful, and written in a tone that feels like a warm, exciting, and empowering conversation with a friendly expert.

**Tone and Style - CRITICAL INSTRUCTIONS:**
1.  **Human, Not Robotic:** Your writing MUST be conversational. Use "I," "you," and "we" to build a direct connection. Paragraphs MUST be very short (1-3 sentences) for easy reading.
2.  **Emotional and Engaging:** Infuse the text with genuine emotion. Use a variety of tones like "Empowering," "Friendly," "Creative," "Motivating," and "Conversational". Make the reader feel excited and motivated.
3.  **No Jargon:** Explain complex topics in a simple, easy-to-understand way. Avoid technical jargon.

**JSON Structure Template & Rules:**
You MUST respond with a single, valid JSON object. Do not include any text, comments, or markdown before or after the JSON.
{
  "title": "A catchy, EXACTLY 9-word title about the topic.",
  "articleContent": [
    { "type": "h2", "content": "First main heading." },
    { "type": "p", "content": "A very short, engaging paragraph (1-2 sentences)." },
    { "type": "p", "content": "Another short, friendly paragraph." },
    { "type": "h3", "content": "A subheading to dive deeper." },
    { "type": "p", "content": "A detailed but concise paragraph." },
    { "type": "h4", "content": "A more specific heading." },
    { "type": "p", "content": "A simple explanation." },
    { "type": "h5", "content": "A heading for a small detail." },
    { "type": "p", "content": "A final short paragraph for this section." },
    { "type": "h6", "content": "An even more specific heading." },
    { "type": "p", "content": "A final short paragraph for this subsection." }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5", "Takeaway 6"],
  "conclusion": "A strong, empowering, and short concluding paragraph.",
  "imagePrompt": "A 10-15 word, highly descriptive prompt for a beautiful header image."
}

**Content & Formatting - CRITICAL INSTRUCTIONS:**
1.  **Total Word Count:** The combined text of all "content" fields MUST be approximately 2000 words.
2.  **Heading Structure:** The "articleContent" array MUST use a logical and deep heading structure, including H2, H3, H4, and even H5/H6 tags to break down the topic comprehensively. This is compulsory.
3.  **Title Constraint:** The "title" MUST be exactly 9 words long.
4.  **Key Takeaways:** The "keyTakeaways" array MUST contain exactly 6 concise, insightful, and helpful bullet-point style takeaways.
5.  **Relevance:** The content must be highly relevant to the TOPIC and CATEGORY provided.
6.  **Strict JSON:** The entire output must be a single, valid JSON object, ready for parsing.`;


async function generateWithOpenRouter(model: string, topic: string, category: string, apiKey: string): Promise<string | null> {
    const fullPrompt = `${JSON_PROMPT_STRUCTURE}\n\nNow, generate the content for:\nTopic: "${topic}"\nCategory: "${category}"`;
    
    try {
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: fullPrompt }],
                response_format: { type: "json_object" },
            }),
        });

        if (!openRouterResponse.ok) {
            const errorBody = await openRouterResponse.text();
            console.warn(`API Route: OpenRouter model ${model} failed with status: ${openRouterResponse.status}`, errorBody);
            return null;
        }

        const openRouterData = await openRouterResponse.json();
        return openRouterData.choices[0]?.message?.content || null;
    } catch (error) {
        console.warn(`API Route: Request to OpenRouter model ${model} failed.`, error);
        return null;
    }
}


export async function POST(req: Request) {
  try {
    const { topic, category } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key is not configured on the server.' }, { status: 500 });
    }
    
    if (!topic || !category) {
        return NextResponse.json({ error: 'Topic and category are required.' }, { status: 400 });
    }

    let aiTextResponse: string | null = null;
    
    // First, try all priority models
    for (const model of PRIORITY_MODELS) {
        aiTextResponse = await generateWithOpenRouter(model, topic, category, apiKey);
        if (aiTextResponse) break; 
    }

    // If all priority models fail, then try fallback models
    if (!aiTextResponse) {
        for (const model of FALLBACK_MODELS) {
            aiTextResponse = await generateWithOpenRouter(model, topic, category, apiKey);
            if (aiTextResponse) break;
        }
    }

    if (!aiTextResponse) {
        return NextResponse.json({ error: `All OpenRouter models failed to generate the article for topic: "${topic}".` }, { status: 500 });
    }
    
    // The response from the AI is already a JSON string, so we can return it directly
    // But first, let's parse it to ensure it's valid before sending it back.
    try {
        const articleData = JSON.parse(aiTextResponse);
        return NextResponse.json(articleData);
    } catch (e) {
        return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[GENERATE_ARTICLE_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate article', details: error.message }, { status: 500 });
  }
}
