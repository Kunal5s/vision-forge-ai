import { NextRequest, NextResponse } from 'next/server';
import { generateImageWithGoogle } from '@/ai/flows/generateImageFlow';
import { HuggingFaceInference } from '@huggingface/inference';

// Helper to get dimensions from aspect ratio string
function getDimensions(aspect: string): { width: number; height: number } {
  try {
    const [w, h] = aspect.split(':').map(Number);
    // Base size for the longest edge
    const baseSize = 1024;
    if (w > h) {
      return { width: baseSize, height: Math.round(baseSize * (h / w)) };
    } else {
      return { width: Math.round(baseSize * (w / h)), height: baseSize };
    }
  } catch (error) {
    // Default to square if aspect ratio is invalid
    return { width: 1024, height: 1024 };
  }
}

// Handler for Pollinations API
async function getPollinationsImage(prompt: string, aspect: string): Promise<string> {
  const { width, height } = getDimensions(aspect);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Pollinations API request failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  return `data:${blob.type};base64,${buffer.toString('base64')}`;
}

// Handler for Hugging Face API
async function getHuggingFaceImage(prompt: string, model: string): Promise<string> {
  if (!process.env.HUGGINGFACE_KEY) {
    throw new Error('Hugging Face API key is not configured.');
  }
  const hf = new HuggingFaceInference(process.env.HUGGINGFACE_KEY);
  const blob = await hf.textToImage({
    model: model,
    inputs: prompt,
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  return `data:${blob.type};base64,${buffer.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, aspect, count } = await req.json();

    if (!prompt || !model || !aspect || !count) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const imageUrls: string[] = [];

    // Generate images sequentially to avoid rate limiting
    for (let i = 0; i < count; i++) {
      const uniquePrompt = `${prompt} seed ${Math.random() * 1000000}`;
      let imageUrl: string;

      if (model.startsWith('huggingface/')) {
        const hfModel = model.replace('huggingface/', '');
        imageUrl = await getHuggingFaceImage(uniquePrompt, hfModel);
      } else if (model === 'gemini') {
        imageUrl = await generateImageWithGoogle(uniquePrompt);
      } else {
        // Default to Pollinations
        imageUrl = await getPollinationsImage(uniquePrompt, aspect);
      }
      imageUrls.push(imageUrl);
    }

    return NextResponse.json({ images: imageUrls });
  } catch (error: any) {
    console.error('[API_GENERATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
