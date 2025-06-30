
export const config = {
  runtime: 'edge', // This is important for Cloudflare Workers
};

// Helper to convert aspect ratio string to dimensions for Pollinations
const getPollinationsDimensions = (aspectRatio) => {
  const baseSize = 1024;
  const [w, h] = aspectRatio.split(':').map(Number);
  if (w > h) {
    return { width: baseSize, height: Math.round((baseSize * h) / w) };
  } else {
    return { width: Math.round((baseSize * w) / h), height: baseSize };
  }
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST method is allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { 
      prompt: rawPrompt, 
      model, 
      aspectRatio = '1:1', 
      numberOfImages = 1 
    } = await req.json();

    if (!rawPrompt || !model) {
      return new Response(JSON.stringify({ error: 'Prompt and model are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enhance prompt for better quality and no watermarks
    const basePrompt = `${rawPrompt}, high resolution, high quality, sharp focus, no watermark, photorealistic`;

    let imageUrls = [];

    if (model === 'pollinations') {
      const { width, height } = getPollinationsDimensions(aspectRatio);
      
      const promises = Array.from({ length: numberOfImages }).map(() => {
        const uniqueSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        // Append a unique identifier to the prompt itself to force a new generation and break any caching
        const uniquePrompt = `${basePrompt}, variation ID ${uniqueSeed}`; 
        
        return fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(uniquePrompt)}?width=${width}&height=${height}&seed=${uniqueSeed}&nofeed=true`);
      });

      const responses = await Promise.all(promises);
      for(const res of responses) {
        if (!res.ok) throw new Error(`Pollinations API returned status ${res.status}`);
        imageUrls.push(res.url);
      }

    } else {
      return new Response(JSON.stringify({ error: 'Invalid model specified. Only Pollinations is supported.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (imageUrls.length === 0) {
        throw new Error('The selected AI model did not return any images. This may be due to a restrictive prompt or an issue with the service.');
    }

    return new Response(JSON.stringify({ imageUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error("API Error in /api/generate:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: "Image generation failed.", details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
