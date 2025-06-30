# Imagen BrainAi - AI Image Generator

This is a Next.js application built with Firebase Studio. It is a powerful AI image generator that allows users to turn text prompts into stunning art using a variety of cutting-edge AI models.

## Key Features

- **Frontend**: Next.js, React, Tailwind CSS, ShadCN UI
- **Multi-Model Image Generation**: 
  - **Pollinations**: A fast, free model for creative exploration.
  - **Hugging Face**: Multiple alternative creative models (Stable Diffusion, OpenJourney, etc.).
- **Deployment**: Ready for Netlify, Vercel, or Cloudflare Pages.

## Environment Variables

To use the Hugging Face models, you need to set up an API key as an environment variable in your deployment platform (e.g., Cloudflare Pages, Vercel).

- `HUGGINGFACE_KEY`: Your API key from Hugging Face. Required for all **Hugging Face** models.

The **Pollinations** model does not require an API key.

## Getting Started

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The main application logic can be found in `src/app/page.tsx`. The image generation flow is handled in the Edge-compatible API route at `pages/api/generate.js`.
