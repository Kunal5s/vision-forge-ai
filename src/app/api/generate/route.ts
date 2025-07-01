
import { NextRequest, NextResponse } from 'next/server';
import { generateImageWithGoogle } from '@/ai/flows/generateImageFlow';
import { HfInference } from '@huggingface/inference';

// Create an array of Hugging Face keys from environment variables, trimming and filtering out any that are not set.
const hfApiKeys = [
  process.env.HUGGINGFACE_KEY_1,
  process.env.HUGGINGFACE_KEY_2,
  process.env.HUGGINGFACE_KEY_3,
  process.env.HUGGINGFACE_KEY_4,
  process.env.HUGGINGFACE_KEY_5,
]
.map(key => key?.trim()) // Trim whitespace from keys
.filter((key): key is string => !!key); // Filter out empty or undefined keys

// This log helps in debugging Vercel environment variables.
console.log(`[API_INIT] Found ${hfApiKeys.length} Hugging Face API keys.`);


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

// Handler for Hugging Face API with Key Rotation
async function getHuggingFaceImage(prompt: string, model: string): Promise<string> {
  if (hfApiKeys.length === 0) {
    throw new Error('No Hugging Face API keys found. Please check your environment variables (e.g., HUGGINGFACE_KEY_1) in your Vercel project settings.');
  }

  let lastError: any = null;

  for (const key of hfApiKeys) {
    try {
      const hf = new HfInference(key);
      const blob = await hf.textToImage({
        model: model,
        inputs: prompt,
      });
      const buffer = Buffer.from(await blob.arrayBuffer());
      // If successful, return the image data URI and exit the loop
      return `data:${blob.type};base64,${buffer.toString('base64')}`;
    } catch (error: any) {
      lastError = error;
      // Log the error for the specific key and continue to the next one
      console.warn(`Hugging Face API key ending in ...${key.slice(-4)} failed. Trying next key. Error: ${error.message}`);
    }
  }

  // If the loop completes, it means all keys have failed.
  throw new Error(`All Hugging Face API keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
}


export async function POST(req: NextRequest) {
  try {
    const { prompt, model, aspect, count } = await req.json();

    if (!prompt || !model || !aspect || !count) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const imageUrls: string[] = [];
    const imagePromises: Promise<string>[] = [];

    for (let i = 0; i < count; i++) {
        const uniquePrompt = `${prompt} seed ${Math.random() * 1000000} variation ${i + 1}`;
        
        let promise: Promise<string>;
        if (model.startsWith('huggingface/')) {
            const hfModel = model.replace('huggingface/', '');
            promise = getHuggingFaceImage(uniquePrompt, hfModel);
        } else if (model === 'gemini') {
            promise = generateImageWithGoogle(uniquePrompt);
        } else {
            // Default to Pollinations
            promise = getPollinationsImage(uniquePrompt, aspect);
        }
        imagePromises.push(promise);
    }
    
    // Use Promise.allSettled to wait for all promises to resolve or reject
    const results = await Promise.allSettled(imagePromises);
    
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            imageUrls.push(result.value);
        } else {
            // Log the error for the failed image generation
            console.error('An image generation failed:', result.reason);
        }
    });

    if (imageUrls.length === 0) {
        return NextResponse.json({ error: 'All image generations failed. Please try a different model or prompt.' }, { status: 500 });
    }

    return NextResponse.json({ images: imageUrls });
  } catch (error: any) {
    console.error('[API_GENERATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
