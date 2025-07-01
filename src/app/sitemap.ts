export const dynamic = 'error';
export function GET() {
  return new Response('', {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}
