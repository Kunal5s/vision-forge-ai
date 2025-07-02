
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'Image generation is currently disabled.' },
    { status: 403 }
  );
}
