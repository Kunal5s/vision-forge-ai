export const dynamic = 'error';
export function GET() {
  return new Response('User-agent: *\nDisallow: /', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
