
// This function handles future text generation requests using Google's Gemini Pro model.
// It is structured for Cloudflare Pages and reads the API key from environment variables.

export async function onRequestPost(context) {
  try {
    // Get the prompt from the request body.
    const { prompt } = await context.request.json();
    // Safely get the API key from Cloudflare's environment variable bindings.
    const GEMINI_API_KEY = context.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in Cloudflare Pages bindings.");
    }

    // Call the Gemini API.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "Failed to fetch response from Gemini API.");
    }
    
    // Return the generated text to the client.
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    // Return any errors in a standard format.
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
