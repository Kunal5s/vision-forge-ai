
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

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST method is allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { prompt, model } = await req.json();

    if (!prompt || !model) {
      return new Response(JSON.stringify({ error: 'Prompt and model are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let imageUrl = '';

    if (model === 'pollinations') {
      const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
      if (!response.ok) throw new Error(`Pollinations API error: ${response.statusText}`);
      const buffer = await response.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const mimeType = response.headers.get('content-type') || 'image/png';
      imageUrl = `data:${mimeType};base64,${base64}`;

    } else if (model === 'huggingface') {
      const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_KEY;
      if (!apiKey) throw new Error('Hugging Face API key is missing. Please set NEXT_PUBLIC_HUGGINGFACE_KEY in your environment variables.');
      
      const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API Error: ${errorText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      imageUrl = `data:image/png;base64,${base64}`;

    } else if (model === 'gemini') {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
       if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
         throw new Error('Google Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env file.');
       }
      
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImage?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { text: prompt },
        }),
      });

      if (!geminiRes.ok) {
        const errorData = await geminiRes.json();
        throw new Error(`Google Imagen API error: ${errorData.error?.message || geminiRes.statusText}`);
      }
      
      const geminiJson = await geminiRes.json();
      if (geminiJson.images && geminiJson.images[0]) {
        const img = geminiJson.images[0];
        imageUrl = `data:${img.mimeType};base64,${img.b64Json}`;
      } else {
        throw new Error('Google Imagen API returned no image data.');
      }

    } else {
      return new Response(JSON.stringify({ error: 'Invalid model specified' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ imageUrls: [imageUrl] }), {
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
