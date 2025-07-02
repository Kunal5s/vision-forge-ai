
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Set runtime to edge for Cloudflare Pages

const getAspectRatioDimensions = (aspect: string): { width: number, height: number } => {
    const baseSize = 1024;
    const [w, h] = aspect.split(':').map(Number);
    const ratio = w / h;
    if (ratio > 1) { // Landscape
        return { width: baseSize, height: Math.round(baseSize / ratio) };
    } else { // Portrait or square
        return { width: Math.round(baseSize * ratio), height: baseSize };
    }
};

export async function POST(req: Request) {
  try {
    const { prompt, aspect = '1:1', count = 1 } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const imagePromises: Promise<string>[] = [];
    const { width, height } = getAspectRatioDimensions(aspect);
    
    // Simplified to only use Pollinations which is Edge compatible
    for (let i = 0; i < count; i++) {
        const seed = Math.floor(Math.random() * 100000);
        const finalPrompt = `${prompt}, aspect ratio ${aspect}`;
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}`;
        imagePromises.push(Promise.resolve(pollinationsUrl));
    }
    const images = await Promise.all(imagePromises);

    if (!images || images.length === 0) {
        throw new Error('The API returned no images. Please try a different prompt.');
    }

    return NextResponse.json({ images });

  } catch (err: any) {
    console.error('[API_ERROR]', err);
    return NextResponse.json(
      { error: 'Image generation failed', details: err.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
