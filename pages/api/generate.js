
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

// Helper to convert ArrayBuffer to Base64 in an Edge-friendly way
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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
    const prompt = `${rawPrompt}, high resolution, high quality, sharp focus, no watermark, photorealistic`;

    let imageUrls = [];

    if (model === 'pollinations') {
      const { width, height } = getPollinationsDimensions(aspectRatio);
      const promises = Array.from({ length: numberOfImages }).map(() => 
        fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${Math.random()}&nofeed=true`)
      );
      const responses = await Promise.all(promises);
      for(const res of responses) {
        if (!res.ok) throw new Error(`Pollinations API returned status ${res.status}`);
        imageUrls.push(res.url);
      }

    } else if (model === 'huggingface') {
      const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_KEY;
      if (!apiKey) throw new Error('Hugging Face API key is not configured in Cloudflare environment variables.');
      
      const promises = Array.from({ length: numberOfImages }).map(() =>
        fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        })
      );
      
      const responses = await Promise.all(promises);
      const blobPromises = responses.map(async (res) => {
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Hugging Face API Error:', errorText);
            throw new Error(`Hugging Face API returned status ${res.status}. Check your API key and model identifier.`);
        }
        const blob = await res.blob();
        const buffer = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        return `data:${blob.type};base64,${base64}`;
      });

      imageUrls = await Promise.all(blobPromises);

    } else if (model === 'gemini') {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is not configured in Cloudflare environment variables.');
      
      const geminiApiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagegeneration:generateImage?key=${apiKey}`;

      const response = await fetch(geminiApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { text: prompt },
          number_of_images: numberOfImages,
          aspect_ratio: aspectRatio,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json();
        console.error('Gemini API Error:', errorJson);
        throw new Error(errorJson.error?.message || 'Failed to generate image with Gemini. Check your API key.');
      }

      const result = await response.json();
      imageUrls = result.images?.map(img => `data:image/png;base64,${img.imageData}`) || [];

    } else {
      return new Response(JSON.stringify({ error: 'Invalid model specified' }), {
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
