export const dynamic = 'error';
export function GET() {
  // This is a fallback and will be overridden by public/sitemap.xml
  return new Response('', {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}
