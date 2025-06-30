
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

// Helper to calculate dimensions from an aspect ratio string
function getDimensionsFromRatio(ratio, baseSize = 1024) {
  if (!ratio || typeof ratio !== 'string' || !ratio.includes(':')) {
    // Default to square if ratio is invalid
    return { width: baseSize, height: baseSize };
  }

  const [w, h] = ratio.split(':').map(Number);
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) {
    return { width: baseSize, height: baseSize };
  }

  if (w > h) {
    const width = baseSize;
    const height = Math.round(width * (h / w));
    return { width, height };
  } else {
    const height = baseSize;
    const width = Math.round(height * (w / h));
    return { width, height };
  }
}

// Handler for Pollinations model (Sequential Generation)
async function handlePollinations(prompt, numberOfImages, width, height) {
  const imageUrls = [];

  for (let i = 0; i < numberOfImages; i++) {
    // Generate a unique seed to get different images for the same prompt
    const seed = Math.floor(Math.random() * 100000);
    // The API prefers a simple URL. Appending the seed ensures we get variations.
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=${width}&height=${height}&nofeed=true`;
    
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
async function handleHuggingFace(prompt, model, numberOfImages) {
  // This log helps confirm if the key is loaded in the environment. It does not expose the key itself.
  console.log("Checking for Hugging Face key:", process.env.NEXT_PUBLIC_HUGGINGFACE_KEY ? "Found" : "Missing");
  const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key is missing. Please set NEXT_PUBLIC_HUGGINGFACE_KEY in your environment variables.');
  }

  const imageUrls = [];
  
  for (let i = 0; i < numberOfImages; i++) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
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

// Handler for Google Imagen 3.
async function handleGoogleImagen(prompt) {
    // This is a placeholder. The user wants to add Google Imagen 3 to the UI.
    // The actual API call requires a more complex setup (OAuth 2.0) than a simple API key from the Edge.
    // To prevent crashes and guide the user, we throw a clear error.
    throw new Error('Google Imagen 3 integration is not yet supported in this backend. A secure server-side proxy with OAuth2.0 authentication is required for this model.');
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
    const { 
      prompt, 
      model,
      style,
      mood,
      lighting,
      color,
      aspectRatio, 
      numberOfImages = 1 
    } = await req.json();
    
    let finalPrompt = prompt;
    if (style) finalPrompt += `, ${style} style`;
    if (mood) finalPrompt += `, ${mood} mood`;
    if (lighting) finalPrompt += `, ${lighting} lighting`;
    if (color) finalPrompt += `, ${color} color palette`;

    let imageUrls = [];

    if (model === 'google-imagen') {
      imageUrls = await handleGoogleImagen(finalPrompt);
    } else if (model === 'pollinations') {
      // Calculate dimensions from aspect ratio for Pollinations
      const { width, height } = getDimensionsFromRatio(aspectRatio);
      imageUrls = await handlePollinations(finalPrompt, numberOfImages, width, height);
    } else {
      // For Hugging Face, add aspect ratio to the prompt text as it does not support width/height params
      const hfPrompt = `${finalPrompt}, aspect ratio ${aspectRatio}`;
      imageUrls = await handleHuggingFace(hfPrompt, model, numberOfImages);
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
