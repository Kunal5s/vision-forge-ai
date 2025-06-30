# Imagen BrainAi - AI Image Generator

This is a Next.js application built with Firebase Studio. It is a powerful AI image generator that allows users to turn text prompts into stunning art using a variety of cutting-edge AI models.

## Key Features

- **Frontend**: Next.js, React, Tailwind CSS, ShadCN UI
- **Multi-Model Image Generation**: 
  - **Google Gemini**: For premium, high-quality results.
  - **Pollinations**: A fast, free model for creative exploration.
  - **Hugging Face**: An alternative creative model.
- **Deployment**: Ready for Netlify, Vercel, or Cloudflare Pages.

## Environment Variables

To use the premium models, you need to set up API keys as environment variables in your deployment platform (e.g., Cloudflare Pages, Vercel).

- `GOOGLE_API_KEY`: Your API key for Google AI Studio. Required for the **Google Gemini** model.
- `HUGGINGFACE_KEY`: Your API key from Hugging Face. Required for the **Hugging Face** model.

The **Pollinations** model does not require an API key.

## Getting Started

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The main application logic can be found in `src/app/page.tsx`. The image generation flow is handled in `src/ai/flows/generate-image.ts`.
