export const dynamic = 'error';
export function GET() {
  // This is a fallback and will be overridden by public/robots.txt
  return new Response('User-agent: *\nAllow: /', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
