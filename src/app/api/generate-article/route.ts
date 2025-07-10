// This API route is no longer used.
// The article generation logic has been moved to /src/lib/articles.ts
// to be used directly by server components for better performance and SEO.
// This allows for server-side rendering of articles and persisting them to GitHub.
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated.' },
    { status: 410 }
  );
}
