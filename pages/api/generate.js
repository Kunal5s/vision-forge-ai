
export const config = { runtime: 'edge' };

// Helper to convert ArrayBuffer to Base64 in an Edge environment
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to get dimensions from an aspect ratio string
function getDimensionsFromRatio(ratio = '1:1') {
  // Use a base size for the largest dimension for consistency
  const baseSize = 1024; 
  try {
    const [w, h] = ratio.split(':').map(Number);
    if (isNaN(w) || isNaN(h) || w === 0 || h === 0) {
      return { width: baseSize, height: baseSize };
    }
    
    if (w > h) {
      return { width: baseSize, height: Math.round(baseSize * (h / w)) };
    } else {
      return { width: Math.round(baseSize * (w / h)), height: baseSize };
    }
  } catch (e) {
    // Fallback to square if ratio is invalid
    return { width: baseSize, height: baseSize };
  }
}


export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST method is allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Destructure aspectRatio and numberOfImages from the request body
    const { prompt: userPrompt, model, aspectRatio, numberOfImages = 1 } = await req.json();

    if (!userPrompt || !model) {
      return new Response(JSON.stringify({ error: 'Prompt and model are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Enhance prompt to discourage watermarks and improve quality
    const enhancedPrompt = `${userPrompt}, high quality, no watermark, watermark removed, signature removed`;

    let imageUrls = [];

    if (model === 'pollinations') {
      const { width, height } = getDimensionsFromRatio(aspectRatio);
      const urlPrompt = encodeURIComponent(enhancedPrompt);
      const basePollinationsUrl = `https://image.pollinations.ai/prompt/${urlPrompt}?width=${width}&height=${height}&nofeed=true`;

      // Pollinations doesn't support batch generation, so we call it multiple times
      const promises = Array.from({ length: numberOfImages }).map(async () => {
        // Adding a random seed to get different images for the same prompt
        const randomSeed = Math.floor(Math.random() * 100000);
        const urlWithSeed = `${basePollinationsUrl}&seed=${randomSeed}`;
        const res = await fetch(urlWithSeed);
        return res.url; // The response URL is the image URL
      });
      imageUrls = await Promise.all(promises);

    } else if (model === 'huggingface') {
      const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Hugging Face API key is missing. Please set NEXT_PUBLIC_HUGGINGFACE_KEY in your environment variables.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      const hfUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2";
      const hfHeaders = {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        };
      const hfBody = JSON.stringify({ inputs: enhancedPrompt });

      // Hugging Face inference API doesn't support batching, call it in a loop
      const promises = Array.from({ length: numberOfImages }).map(async () => {
        const response = await fetch(hfUrl, {
          method: "POST",
          headers: hfHeaders,
          body: hfBody,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Hugging Face API Error:", errorText);
          throw new Error(`Hugging Face API Error: ${response.statusText} (${response.status})`);
        }
        
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        return `data:${blob.type};base64,${base64}`;
      });
      imageUrls = await Promise.all(promises);


    } else if (model === 'gemini') {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagegeneration:generateImage?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { text: enhancedPrompt }, // Use enhanced prompt
          number_of_images: numberOfImages,
        }),
      });

      if (!geminiRes.ok) {
        const errorJson = await geminiRes.json();
        console.error("Gemini API Error:", errorJson);
        throw new Error(`Gemini API Error: ${errorJson.error?.message || geminiRes.statusText}`);
      }

      const geminiJson = await geminiRes.json();
      imageUrls = geminiJson.images?.map((img) => `data:image/png;base64,${img.data}`) || [];
      if (imageUrls.length === 0) {
        throw new Error("Gemini API did not return valid image data.");
      }

    } else {
      return new Response(JSON.stringify({ error: `Invalid model specified: ${model}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ imageUrls }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
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
