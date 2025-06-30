
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const config = { runtime: 'edge' };

// Initialize Genkit AI within the API route to ensure it's server-only
const ai = genkit({
  plugins: [
    googleAI({
      // API key is read from GOOGLE_API_KEY env var
    }),
  ],
});


// Helper to get image dimensions from an aspect ratio string
function getDimensionsFromRatio(ratio, baseSize = 1024) {
  const [w, h] = ratio.split(':').map(Number);
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) {
      return { width: 1024, height: 1024 }; // Default to square
  }
  if (w > h) {
    return { width: baseSize, height: Math.round((baseSize * h) / w) };
  } else {
    return { width: Math.round((baseSize * w) / h), height: baseSize };
  }
}

// Handler for Google's Gemini model
async function handleGoogle(prompt, aspectRatio, numberOfImages) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Google API key is missing. Please set GOOGLE_API_KEY in your environment variables.');
  }

  const fullPrompt = `${prompt}, aspect ratio ${aspectRatio}`;
  const generationPromises = Array.from({ length: numberOfImages }, () =>
    ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: fullPrompt,
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    })
  );

  const results = await Promise.all(generationPromises);
  return results.map(result => {
    if (!result.media?.url) {
      throw new Error('Image generation failed, possibly due to a safety policy violation. Try a different prompt.');
    }
    return result.media.url;
  });
}

// Handler for Pollinations model
async function handlePollinations(prompt, aspectRatio, numberOfImages) {
  const imageUrls = [];
  const { width, height } = getDimensionsFromRatio(aspectRatio);
  const baseUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  
  for (let i = 0; i < numberOfImages; i++) {
    const seed = Math.floor(Math.random() * 100000);
    const url = `${baseUrl}?width=${width}&height=${height}&seed=${seed}&nofeed=true`;
    
    // We don't need to convert to data URI for Pollinations as it returns a direct image link.
    // However, to maintain consistency and avoid cross-origin issues on the client,
    // we fetch and convert to a data URI on the server.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pollinations API returned status ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    imageUrls.push(`data:${mimeType};base64,${base64}`);
  }
  return imageUrls;
}

// Handler for Hugging Face models
async function handleHuggingFace(prompt, model, aspectRatio, numberOfImages) {
  const apiKey = process.env.HUGGINGFACE_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key is missing. Please set HUGGINGFACE_KEY in your environment variables.');
  }

  const imageUrls = [];
  const fullPrompt = `${prompt}, aspect ratio ${aspectRatio}`;

  for (let i = 0; i < numberOfImages; i++) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: fullPrompt }),
    });

    if (response.status === 503) {
      throw new Error(`Hugging Face model '${model}' is currently loading. Please try again in a moment.`);
    }
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Hugging Face API Error: ${errorBody.error || `Status ${response.status}`}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    imageUrls.push(`data:${mimeType};base64,${base64}`);
  }
  return imageUrls;
}

// Main API handler for Edge Runtime
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt, model, aspectRatio, numberOfImages } = await req.json();
    let imageUrls = [];

    if (model === 'google') {
      imageUrls = await handleGoogle(prompt, aspectRatio, numberOfImages);
    } else if (model === 'pollinations') {
      imageUrls = await handlePollinations(prompt, aspectRatio, numberOfImages);
    } else {
      // All other models are assumed to be from Hugging Face
      imageUrls = await handleHuggingFace(prompt, model, aspectRatio, numberOfImages);
    }

    return new Response(JSON.stringify({ imageUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error("API Error in /api/generate:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
