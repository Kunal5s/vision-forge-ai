
export const config = { runtime: 'edge' };

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper to get dimensions for Pollinations API
function getDimensionsFromRatio(ratio, baseSize = 1024) {
  if (!ratio || typeof ratio !== 'string' || !ratio.includes(':')) {
    return { width: baseSize, height: baseSize };
  }
  const [w, h] = ratio.split(':').map(Number);
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) {
    return { width: baseSize, height: baseSize };
  }
  if (w > h) {
    return { width: baseSize, height: Math.round(baseSize * (h / w)) };
  } else {
    return { width: Math.round(baseSize * (w / h)), height: baseSize };
  }
}

// Main API handler
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

    if (!prompt || !model) {
      return new Response(JSON.stringify({ error: 'Missing prompt or model' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construct the final prompt with all modifiers
    let finalPrompt = prompt;
    if (style) finalPrompt += `, ${style} style`;
    if (mood) finalPrompt += `, ${mood} mood`;
    if (lighting) finalPrompt += `, ${lighting} lighting`;
    if (color) finalPrompt += `, ${color} color palette`;

    let imageUrls = [];
    const imagePromises = [];

    if (model === 'pollinations') {
      const { width, height } = getDimensionsFromRatio(aspectRatio);
      for (let i = 0; i < numberOfImages; i++) {
        const seed = Math.floor(Math.random() * 100000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?seed=${seed}&width=${width}&height=${height}&nofeed=true`;
        imagePromises.push(fetch(url).then(async (response) => {
            if (!response.ok) throw new Error(`Pollinations API error: ${response.statusText}`);
            const buffer = await response.arrayBuffer();
            const base64 = arrayBufferToBase64(buffer);
            const mimeType = response.headers.get('content-type') || 'image/png';
            return `data:${mimeType};base64,${base64}`;
        }));
      }
    } else if (model === 'google-imagen') {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Google Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
      
      for (let i = 0; i < numberOfImages; i++) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImage?key=${apiKey}`;
        const payload = {
            prompt: { text: finalPrompt },
            aspect_ratio: aspectRatio,
        };
        imagePromises.push(fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Google Imagen API error: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            if (data.images && data.images[0]) {
                const img = data.images[0];
                return `data:${img.mimeType};base64,${img.b64Json}`;
            }
            throw new Error('Google Imagen API returned no image data.');
        }));
      }
    } else { // Default to Hugging Face
      const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_KEY;
      if (!apiKey) throw new Error('Hugging Face API key is missing. Please set NEXT_PUBLIC_HUGGINGFACE_KEY in your environment variables.');
      
      const hfPrompt = `${finalPrompt}, aspect ratio ${aspectRatio}`;
      for (let i = 0; i < numberOfImages; i++) {
        imagePromises.push(fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: hfPrompt }),
        }).then(async (response) => {
            if (response.status === 503) throw new Error(`Hugging Face model '${model}' is loading. Try again soon.`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hugging Face API Error for '${model}': ${errorText}`);
            }
            const buffer = await response.arrayBuffer();
            const base64 = arrayBufferToBase64(buffer);
            const mimeType = response.headers.get('content-type') || 'image/jpeg';
            return `data:${mimeType};base64,${base64}`;
        }));
      }
    }
    
    imageUrls = await Promise.all(imagePromises);

    return new Response(JSON.stringify({ imageUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("API Error in /api/generate:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
