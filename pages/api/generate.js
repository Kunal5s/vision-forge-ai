
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

// Handler for Pollinations model (Sequential Generation)
async function handlePollinations(prompt, aspectRatio, numberOfImages) {
  const imageUrls = [];
  const { width, height } = getDimensionsFromRatio(aspectRatio);

  for (let i = 0; i < numberOfImages; i++) {
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nofeed=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pollinations API returned status ${response.status} on image ${i + 1}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const mimeType = response.headers.get('content-type') || 'image/png';
    imageUrls.push(`data:${mimeType};base64,${base64}`);
  }

  return imageUrls;
}


// Handler for Hugging Face models (Sequential Generation)
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
        let errorBodyText = await response.text();
        let errorMessage = `Hugging Face API Error: Status ${response.status}`;
        try {
            // Try to parse as JSON for a more specific error message
            const errorBodyJson = JSON.parse(errorBodyText);
            errorMessage = `Hugging Face API Error: ${errorBodyJson.error || `Status ${response.status}`}`;
        } catch (e) {
            // If it's not JSON, include the raw text
            errorMessage += ` - ${errorBodyText}`;
        }
        throw new Error(errorMessage);
    }
    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
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

  } catch (e) {
    console.error("API Error in /api/generate:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
