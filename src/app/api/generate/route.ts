
import { NextResponse } from 'next/server';
import { generateImage } from '@/ai/flows/generateImageFlow';

export const runtime = 'nodejs'; // Use Node.js for full Genkit/fs compatibility

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
    const { prompt, model, aspect = '1:1', count = 1 } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let images: string[] = [];
    const finalPrompt = `${prompt}, aspect ratio ${aspect}`;
    
    if (model === 'gemini') {
        const result = await generateImage({ prompt: finalPrompt, count });
        images = result.images;
    } else { // Default to Pollinations
        const imagePromises: Promise<string>[] = [];
        const { width, height } = getAspectRatioDimensions(aspect);
        
        for (let i = 0; i < count; i++) {
            const seed = Math.floor(Math.random() * 100000);
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}`;
            // We directly use the URL for Pollinations as it's designed to be an image source.
            imagePromises.push(Promise.resolve(pollinationsUrl));
        }
        images = await Promise.all(imagePromises);
    }

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
