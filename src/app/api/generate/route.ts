
import { NextResponse } from 'next/server';
import { generateImage } from '@/ai/flows/generateImageFlow';

export const runtime = 'nodejs'; // Use Node.js for full Genkit/fs compatibility

const HUGGINGFACE_KEYS = [
  process.env.HUGGINGFACE_KEY_1,
  process.env.HUGGINGFACE_KEY_2,
  process.env.HUGGINGFACE_KEY_3,
  process.env.HUGGINGFACE_KEY_4,
  process.env.HUGGINGFACE_KEY_5,
].filter(Boolean);

if (HUGGINGFACE_KEYS.length === 0) {
    console.warn('[API_INIT] Found 0 Hugging Face API keys. Hugging Face models will not work.');
} else {
    console.log(`[API_INIT] Found ${HUGGINGFACE_KEYS.length} Hugging Face API keys.`);
}

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
    } else {
        const imagePromises: Promise<string>[] = [];
        for (let i = 0; i < count; i++) {
            if (model.includes('/')) { // Hugging Face model
                if (HUGGINGFACE_KEYS.length === 0) {
                    throw new Error('Hugging Face models are not available: No API key configured.');
                }
                const key = HUGGINGFACE_KEYS[i % HUGGINGFACE_KEYS.length];
                imagePromises.push(
                    fetch(`https://api-inference.huggingface.co/models/${model}`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${key}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ inputs: finalPrompt }),
                    }).then(async res => {
                        if (!res.ok) {
                           const errorBody = await res.text();
                           console.error(`Hugging Face API Error for model ${model}: ${res.status} ${res.statusText}`, errorBody);
                           throw new Error(`Hugging Face API returned ${res.status}. Check server logs for details.`);
                        }
                        const blob = await res.blob();
                        const buffer = Buffer.from(await blob.arrayBuffer());
                        return `data:${blob.type};base64,${buffer.toString('base64')}`;
                    })
                );
            } else { // Default to Pollinations
                const { width, height } = getAspectRatioDimensions(aspect);
                const seed = Math.floor(Math.random() * 100000);
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}`;
                // We directly use the URL for Pollinations as it's designed to be an image source.
                imagePromises.push(Promise.resolve(pollinationsUrl));
            }
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
