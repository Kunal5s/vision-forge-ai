
export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST method is allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const prompt = body.prompt || "No prompt provided";

    // The frontend expects an array of URLs in the 'imageUrls' key.
    const responseJson = {
      imageUrls: ["https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg"]
    };

    return new Response(JSON.stringify(responseJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("API Error in /api/generate:", errorMessage);
    // Matching the user's requested error format
    return new Response(JSON.stringify({ error: "Invalid JSON format", details: errorMessage }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
