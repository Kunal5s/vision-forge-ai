
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

// Edge-compatible function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

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

// Handler for Pollinations model
async function handlePollinations(prompt, aspectRatio, numberOfImages) {
  const imageUrls = [];
  const { width, height } = getDimensionsFromRatio(aspectRatio);
  
  const generationPromises = Array.from({ length: numberOfImages }, (_, i) => {
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nofeed=true`;
    
    return fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Pollinations API returned status ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const mimeType = response.headers.get('content-type') || 'image/png';
      return `data:${mimeType};base64,${base64}`;
    });
  });

  return Promise.all(generationPromises);
}


// Handler for Hugging Face models
async function handleHuggingFace(prompt, model, aspectRatio, numberOfImages) {
  const apiKey = process.env.HUGGINGFACE_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key is missing. Please set HUGGINGFACE_KEY in your environment variables.');
  }

  const fullPrompt = `${prompt}, aspect ratio ${aspectRatio}`;

  const generationPromises = Array.from({ length: numberOfImages }, () => 
    fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: fullPrompt }),
    }).then(async (response) => {
        if (response.status === 503) {
            throw new Error(`Hugging Face model '${model}' is currently loading. Please try again in a moment.`);
        }
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Hugging Face API Error: ${errorBody.error || `Status ${response.status}`}`);
        }
        const buffer = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
    })
  );
  
  return Promise.all(generationPromises);
}

// Main API handler for Edge Runtime
export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt, model, aspectRatio, numberOfImages = 1 } = await req.json();
    let imageUrls = [];

    if (model === 'pollinations') {
      imageUrls = await handlePollinations(prompt, aspectRatio, numberOfImages);
    } else {
      // All other models are assumed to be from Hugging Face
      imageUrls = await handleHuggingFace(prompt, model, aspectRatio, numberOfImages);
    }

    return new Response(JSON.stringify({ imageUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error("API Error in /api/generate:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
