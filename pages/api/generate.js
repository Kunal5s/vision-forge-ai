// This API route is deprecated and no longer in use.
// The frontend now calls the external Vercel API directly.
// This file can be safely deleted.
export default async function handler(req) {
    return new Response(JSON.stringify({ 
        error: 'This API endpoint is deprecated.',
        message: 'Please update your client to use the https://vision-forge-ai.vercel.app/api/generate endpoint.'
    }), {
        status: 410, // Gone
        headers: { 'Content-Type': 'application/json' },
    });
}
