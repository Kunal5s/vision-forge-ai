// This file is a placeholder and not currently in use.
// It is configured for the Edge runtime to prevent build failures on Cloudflare.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  return new Response(
    JSON.stringify({ message: 'This endpoint is not in use and can be removed.' }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
