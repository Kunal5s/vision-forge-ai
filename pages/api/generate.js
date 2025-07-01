
export const config = {
  runtime: 'edge',
};

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

export default async function handler(req) {
    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await req.json();
        const {
            prompt: rawPrompt,
            aspectRatio = '1:1',
            numberOfImages = 1
        } = body;

        if (!rawPrompt || typeof rawPrompt !== 'string' || rawPrompt.trim() === '') {
            return new Response(JSON.stringify({ error: 'A valid prompt is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const basePrompt = `${rawPrompt}, high resolution, high quality, sharp focus, no watermark, photorealistic`;
        const { width, height } = getPollinationsDimensions(aspectRatio);
        let imageUrls = [];

        for (let i = 0; i < numberOfImages; i++) {
            const uniqueSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            const uniquePrompt = `${basePrompt}, variation ${i + 1}, unique id ${uniqueSeed}`;
            const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(uniquePrompt)}?width=${width}&height=${height}&seed=${uniqueSeed}&nofeed=true`;

            const res = await fetch(pollUrl);

            if (!res.ok) {
                const errorText = await res.text();
                // We substring to prevent sending a massive error message back to the client.
                throw new Error(`Pollinations API Error (Status ${res.status}): ${errorText.substring(0, 150)}`);
            }
            
            imageUrls.push(res.url);
        }

        if (imageUrls.length === 0) {
            throw new Error('The AI model did not return any images. The prompt might be too restrictive or the service may be temporarily unavailable.');
        }

        return new Response(JSON.stringify({ imageUrls }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        // This is the ultimate safety net. No matter what error happens above,
        // this block will catch it and ensure a valid JSON error response is sent.
        // This permanently prevents the `Unexpected token '<'` error.
        console.error("--- UNHANDLED ERROR IN /api/generate ---", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';

        return new Response(
            JSON.stringify({
                error: 'Image Generation Failed',
                details: errorMessage,
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
