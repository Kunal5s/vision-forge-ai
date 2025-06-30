
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

    // Destructure aspectRatio from the request body
    const { prompt: userPrompt, model, aspectRatio } = await req.json();

    if (!userPrompt || !model) {
      return new Response(JSON.stringify({ error: 'Prompt and model are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Enhance prompt to discourage watermarks and improve quality
    const enhancedPrompt = `${userPrompt}, high quality, no watermark, watermark removed, signature removed`;

    let imageUrl = '';

    if (model === 'pollinations') {
      const { width, height } = getDimensionsFromRatio(aspectRatio);
      // Add width, height, and nofeed parameters to the Pollinations URL
      const urlPrompt = encodeURIComponent(enhancedPrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${urlPrompt}?width=${width}&height=${height}&nofeed=true`;

    } else if (model === 'huggingface') {
      const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Hugging Face API key is missing. Please set NEXT_PUBLIC_HUGGINGFACE_KEY in your environment variables.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: enhancedPrompt }), // Use enhanced prompt
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face API Error:", errorText);
        throw new Error(`Hugging Face API Error: ${response.statusText} (${response.status})`);
      }
      
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      imageUrl = `data:${blob.type};base64,${base64}`;

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
          number_of_images: 1,
        }),
      });

      if (!geminiRes.ok) {
        const errorJson = await geminiRes.json();
        console.error("Gemini API Error:", errorJson);
        throw new Error(`Gemini API Error: ${errorJson.error?.message || geminiRes.statusText}`);
      }

      const geminiJson = await geminiRes.json();
      const base64 = geminiJson.images?.[0]?.data;
      if (!base64) {
        throw new Error("Gemini API did not return valid image data.");
      }
      imageUrl = `data:image/png;base64,${base64}`;

    } else {
      return new Response(JSON.stringify({ error: `Invalid model specified: ${model}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // The frontend expects the `imageUrls` property to be an array of strings.
    return new Response(JSON.stringify({ imageUrls: [imageUrl] }), {
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
