
export const config = {
  runtime: 'edge', // This is important for Cloudflare, Netlify, and Vercel Edge Functions
};

// Helper to convert aspect ratio string to dimensions for Pollinations
const getPollinationsDimensions = (aspectRatio) => {
  const baseSize = 1024;
  const [w, h] = aspectRatio.split(':').map(Number);

  // Cap dimensions to a reasonable max to prevent overly large/slow images
  const maxWidth = 1920;
  const maxHeight = 1920;

  let width, height;

  if (w > h) {
    width = Math.min(baseSize, maxWidth);
    height = Math.round((width * h) / w);
  } else {
    height = Math.min(baseSize, maxHeight);
    width = Math.round((height * w) / h);
  }
  return { width, height };
};

export default async function handler(req) {
  // 1. Ensure it's a POST request
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST method is allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Safely parse the JSON body
    const { 
      prompt: rawPrompt, 
      model, // 'model' is kept for future compatibility, but we only use 'pollinations' now.
      aspectRatio = '1:1', 
      numberOfImages = 1 
    } = await req.json();

    // 3. Validate essential inputs
    if (!rawPrompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Enhance the prompt for better quality and to avoid watermarks
    const basePrompt = `${rawPrompt}, high resolution, high quality, sharp focus, no watermark, photorealistic`;

    let imageUrls = [];
    const { width, height } = getPollinationsDimensions(aspectRatio);

    // 5. Generate images sequentially to avoid rate-limiting (429 errors)
    for (let i = 0; i < numberOfImages; i++) {
      // Create a highly unique seed and add a unique identifier to the prompt to force a new image and bypass caching
      const uniqueSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      const uniquePrompt = `${basePrompt}, unique variation id ${uniqueSeed}`; 
      
      const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(uniquePrompt)}?width=${width}&height=${height}&seed=${uniqueSeed}&nofeed=true`;
      
      const res = await fetch(pollUrl);
      
      // 6. Robust check for API response status
      if (!res.ok) {
        // Provide a clear, user-friendly error message for specific, common errors
        if (res.status === 429) {
          throw new Error('Rate limit exceeded. The AI model is receiving too many requests. Please wait a moment and try generating fewer images.');
        }
        // Generic error for other issues
        throw new Error(`The Pollinations AI service returned an error (status: ${res.status}). Please try again later.`);
      }
      
      // The response from Pollinations is a redirect, 'res.url' contains the final image URL
      imageUrls.push(res.url);
    }

    // 7. Check if the API returned any images at all
    if (imageUrls.length === 0) {
        throw new Error('The selected AI model did not return any images. This may be due to a restrictive prompt or a temporary issue with the service.');
    }

    // 8. Always return a valid JSON response on success
    return new Response(JSON.stringify({ imageUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    // 9. Catch any error (JSON parsing, network, or thrown errors) and return a structured JSON error response
    console.error("Error in /api/generate:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: "Image generation failed.", details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
