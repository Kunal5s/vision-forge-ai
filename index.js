export default {
  async fetch(request, env) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImage';

    const payload = {
      prompt: {
        text: "A futuristic city at sunset, digital art"
      },
      aspectRatio: "1:1"
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
};
