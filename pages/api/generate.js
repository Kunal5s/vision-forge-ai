
export const config = {
  runtime: 'edge',
};

// Helper function to get dimensions from aspect ratio
const getPollinationsDimensions = (aspectRatio) => {
  const baseSize = 1024;
  const [w, h] = aspectRatio.split(':').map(Number);
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

// Main API handler
export default async function handler(req) {
  // 1. Ensure it's a POST request from the start
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed', details: 'Only POST requests are accepted.' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 2. Safely parse the JSON body
    const { 
      prompt: rawPrompt, 
      aspectRatio = '1:1', 
      numberOfImages = 1 
    } = await req.json();

    // 3. Validate essential inputs
    if (!rawPrompt || typeof rawPrompt !== 'string' || rawPrompt.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Bad Request', details: 'A valid prompt is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Enhance the prompt for better quality
    const basePrompt = `${rawPrompt}, high resolution, high quality, sharp focus, no watermark, photorealistic`;
    const { width, height } = getPollinationsDimensions(aspectRatio);
    let imageUrls = [];

    // 5. Generate images sequentially to avoid rate-limiting
    for (let i = 0; i < numberOfImages; i++) {
      const uniqueSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      // PERMANENT FIX: Add both a sequential number and a random seed to the prompt
      // This forces the API to treat every request as completely unique, defeating any caching.
      const uniquePrompt = `${basePrompt}, variation ${i + 1}, unique id ${uniqueSeed}`; 
      
      const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(uniquePrompt)}?width=${width}&height=${height}&seed=${uniqueSeed}&nofeed=true`;
      
      const res = await fetch(pollUrl);
      
      // 6. Robust check for API response status
      if (!res.ok) {
        if (res.status === 429) {
          // Specific error for rate limiting
          throw new Error('Rate limit exceeded. The AI model is receiving too many requests. Please wait a moment and try generating fewer images.');
        }
        // Generic error for other issues from the external API
        throw new Error(`The Pollinations AI service returned an error (status: ${res.status}). Please try again later.`);
      }
      
      // The response from Pollinations is a redirect; 'res.url' contains the final image URL.
      // We push it to our array of generated images.
      imageUrls.push(res.url);
    }

    // 7. Check if the API returned any images at all
    if (imageUrls.length === 0) {
      throw new Error('The AI model did not return any images. This might be due to a restrictive prompt or a temporary issue with the service.');
    }

    // 8. On success, always return a valid JSON response
    return new Response(
      JSON.stringify({ imageUrls }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    // 9. CATCH-ALL: This block will catch ANY error from the try block (JSON parsing, network, thrown errors)
    // and guarantee a valid JSON error response is sent, preventing the HTML error page.
    console.error("--- ERROR IN /api/generate ---", e);
    
    // Ensure the error message is a string
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    
    return new Response(
      JSON.stringify({ error: "Image generation failed.", details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
