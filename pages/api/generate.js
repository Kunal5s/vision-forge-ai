
export const config = { runtime: 'edge' };

// This handler is temporarily updated to return a static JSON response
// to fix the "Hello World" parsing error on the frontend.
export default async function handler(req) {
  try {
    // For now, we return a static JSON response to unblock the frontend.
    // The frontend expects the `imageUrls` property to be an array of strings.
    const json = {
      imageUrls: ["https://placehold.co/512x512.png"]
    };

    return new Response(JSON.stringify(json), {
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
