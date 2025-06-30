export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt") || "a fantasy landscape";
    const model = searchParams.get("engine") || "pollinations";
    const aspect = searchParams.get("aspect_ratio") || "1:1";
    const style = searchParams.get("style") || "";
    const mood = searchParams.get("mood") || "";
    const lighting = searchParams.get("lighting") || "";
    const color = searchParams.get("color") || "";

    const finalPrompt = `${prompt}, ${style}, ${mood}, ${lighting}, ${color}`;

    // Pollinations (No API Key)
    if (model === "pollinations") {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?aspect=${aspect}`;
      return Response.redirect(imageUrl, 302);
    }

    // Google Imagen 3 via Gemini
    if (model === "imagen3") {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImage';
      const payload = {
        prompt: {
          text: finalPrompt
        }
      };
      const response = await fetch(`${url}?key=${env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Hugging Face models
    const hfModelMap = {
      "sd15": "runwayml/stable-diffusion-v1-5",
      "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
      "openjourney": "prompthero/openjourney",
      "dreamlike": "dreamlike-art/dreamlike-photoreal-2.0",
      "realistic": "SG161222/Realistic_Vision_V5.1_B1"
    };

    const hfModel = hfModelMap[model];
    if (!hfModel) {
      return new Response("Invalid model", { status: 400 });
    }

    const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NEXT_PUBLIC_HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: finalPrompt })
    });

    const blob = await hfResponse.blob();
    return new Response(blob, {
      headers: { "Content-Type": "image/png" }
    });
  }
};
