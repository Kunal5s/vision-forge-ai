
// This function handles image generation requests and is specifically structured for Cloudflare Pages.
// It calls the Stable Horde API, waits for the image to be generated, and then returns the final URLs.

// Helper function to create a pause, needed for checking generation status.
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function onRequestPost(context) {
  try {
    // Get the prompt and other parameters from the request body.
    const { prompt, numberOfImages, aspectRatio } = await context.request.json();
    
    // Safely get the API key from Cloudflare's environment variable bindings.
    const STABLE_HORDE_API_KEY = context.env.STABLE_HORDE_API_KEY;

    if (!STABLE_HORDE_API_KEY) {
        throw new Error("STABLE_HORDE_API_KEY is not configured in Cloudflare Pages bindings.");
    }

    // Stable Horde requires image dimensions to be multiples of 64.
    const [aspectW, aspectH] = aspectRatio.split(':').map(Number);
    const baseDimension = 512;
    let width, height;

    if (aspectW > aspectH) {
        width = Math.min(1024, baseDimension * (aspectW / aspectH));
        height = baseDimension;
    } else {
        width = baseDimension;
        height = Math.min(1024, baseDimension * (aspectH / aspectW));
    }
    
    // Ensure the final dimensions are multiples of 64.
    const finalWidth = Math.round(width / 64) * 64;
    const finalHeight = Math.round(height / 64) * 64;

    // This is the data we'll send to Stable Horde.
    const payload = {
      prompt: `${prompt} ### (deformed, distorted, disfigured, poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation)`,
      models: ["deliberate", "dreamshaper", "stable_diffusion"],
      params: {
        n: numberOfImages || 1,
        steps: 30,
        cfg_scale: 7.5,
        sampler_name: "k_dpmpp_2s_a",
        height: finalHeight,
        width: finalWidth,
      }
    };

    // Start the asynchronous generation process.
    const asyncResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Agent": "imagenbrainai.in/1.0 (https://imagenbrainai.in)",
        "apikey": STABLE_HORDE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!asyncResponse.ok) {
        const errorText = await asyncResponse.text();
        throw new Error(`Stable Horde async request failed: ${asyncResponse.status} - ${errorText}`);
    }

    const { id: generationId } = await asyncResponse.json();

    if (!generationId) {
      throw new Error("Stable Horde did not return a generation ID.");
    }
    
    // Poll the check endpoint until the image is done.
    for (let i = 0; i < 25; i++) { // Poll for up to 100 seconds
      await sleep(4000); // Wait 4 seconds between checks.

      const checkResponse = await fetch(`https://stablehorde.net/api/v2/generate/check/${generationId}`);
      if (!checkResponse.ok) continue; // Ignore check failure and retry.
      
      const { done } = await checkResponse.json();
      if (done) {
        // Once done, fetch the final image URLs.
        const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${generationId}`);
        if (!statusResponse.ok) throw new Error("Failed to fetch final image status from Stable Horde.");

        const { generations } = await statusResponse.json();
        const imageUrls = generations.map(gen => gen.img.replace("http://", "https://")); // Ensure HTTPS for security.
        
        // Return the image URLs to the client.
        return new Response(JSON.stringify({ imageUrls }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // If the loop finishes without the image being done, it's a timeout.
    throw new Error("Image generation timed out. The community network might be busy or your API key has low priority. Please try again later.");

  } catch (err) {
    // Return any errors in a standard format.
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
