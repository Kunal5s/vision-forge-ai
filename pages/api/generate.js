// pages/api/generate.js

// This tells Vercel/Netlify/Cloudflare to use the Edge Runtime, which is faster and cheaper.
export const config = { runtime: "experimental-edge" };

// Helper function to get dimensions from aspect ratio string
const getDimensionsForRatio = (ratio) => {
    switch (ratio) {
        case '1:1': return { width: 1024, height: 1024 };
        case '16:9': return { width: 1280, height: 720 };
        case '9:16': return { width: 720, height: 1280 };
        case '4:3': return { width: 1024, height: 768 };
        case '3:4': return { width: 768, height: 1024 };
        case '3:2': return { width: 1280, height: 854 };
        case '2:3': return { width: 854, height: 1280 };
        case '21:9': return { width: 1536, height: 640 };
        case '2:1': return { width: 1280, height: 640 };
        case '3:1': return { width: 1536, height: 512 };
        case '5:4': return { width: 1280, height: 1024 };
        default: return { width: 1024, height: 1024 };
    }
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { prompt, aspectRatio = '1:1' } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const { width, height } = getDimensionsForRatio(aspectRatio);
    
    // Add a random seed for variation
    const seed = Math.floor(Math.random() * 1000000);

    // Fetch the image from Pollinations - no API key needed
    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const polRes = await fetch(pollinationUrl);

    if (!polRes.ok) {
      throw new Error(`Pollinations error: ${polRes.status} ${polRes.statusText}`);
    }

    // Get the image data as a buffer
    const arrayBuffer = await polRes.arrayBuffer();

    // Return the image data directly to the client
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*", // Allow browser to render the image
      },
    });

  } catch (e) {
    console.error("Pollination proxy error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
