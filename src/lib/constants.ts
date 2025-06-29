
export interface StyleOption {
  value: string;
  label: string;
  imageUrl: string;
  dataAiHint: string;
}

export const GOOGLE_AI_MODELS = [
  { value: 'googleai/gemini-2.0-flash-preview-image-generation', label: 'Google Imagen 3' },
];

export const PEXELS_MODELS = [
  { value: 'imagen-brain-ai', label: 'Imagen Brain AI' },
];

export const POLLINATIONS_MODELS = [
    { value: 'pollinations', label: 'Pollinations' }
];

export const STABLE_HORDE_MODELS = [
    { value: 'stable_horde', label: 'Stable Horde (Community)' }
];

export const HF_MODELS = [
  { value: 'runwayml/stable-diffusion-v1-5', label: 'Stable Diffusion v1.5' },
  { value: 'stabilityai/sdxl-turbo', label: 'SDXL Turbo' },
  { value: 'prompthero/openjourney', label: 'OpenJourney (Artistic)' },
  { value: 'Linaqruf/anything-v3.0', label: 'Anything v3 (Anime)' },
  { value: 'SG161222/Realistic_Vision_V5.1', label: 'Realistic Vision v5.1' },
];


export const MODEL_GROUPS = [
  {
    label: "Recommended",
    models: GOOGLE_AI_MODELS,
    premium: false, // As requested, free for testing
  },
  {
    label: "Realistic Photos (Powered by Pexels)",
    models: PEXELS_MODELS,
    premium: false,
  },
  {
    label: "Community Models (Free)",
    models: [
        ...POLLINATIONS_MODELS,
        ...STABLE_HORDE_MODELS,
    ],
    premium: false,
  },
  {
    label: "Hugging Face Models (Free)",
    models: HF_MODELS,
    premium: false,
  }
];

// This needs to include all possible model values for Zod validation.
export const ALL_MODEL_VALUES = [
  ...GOOGLE_AI_MODELS.map(m => m.value),
  ...PEXELS_MODELS.map(m => m.value),
  ...POLLINATIONS_MODELS.map(m => m.value),
  ...STABLE_HORDE_MODELS.map(m => m.value),
  ...HF_MODELS.map(m => m.value),
] as [string, ...string[]];

export const ASPECT_RATIOS = [
  { label: "1:1 (Square)", value: "1:1" },
  { label: "16:9 (Widescreen)", value: "16:9" },
  { label: "9:16 (Tall Portrait)", value: "9:16" },
  { label: "4:3 (Standard)", value: "4:3" },
  { label: "3:4 (Portrait)", value: "3:4" },
  { label: "3:2 (Photography)", value: "3:2" },
  { label: "2:3 (Portrait)", value: "2:3" },
  { label: "21:9 (Cinematic)", value: "21:9" },
];

export const STYLES: StyleOption[] = [
  { value: 'photographic', label: 'Photographic', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'photograph' },
  { value: 'cinematic', label: 'Cinematic', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'cinematic still' },
  { value: 'anime', label: 'Anime', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'anime art' },
  { value: 'fantasy art', label: 'Fantasy', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'fantasy art' },
  { value: '3d render', label: '3D Render', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: '3d render' },
  { value: 'pixel art', label: 'Pixel Art', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'pixel art' },
  { value: 'watercolor', label: 'Watercolor', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'watercolor painting' },
  { value: 'line art', label: 'Line Art', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'line art' },
  { value: 'comic book', label: 'Comic Book', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'comic book panel' },
  { value: 'low poly', label: 'Low Poly', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'low poly' },
  { value: 'origami', label: 'Origami', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'origami' },
  { value: 'sticker', label: 'Sticker', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'sticker design' },
];

export const MOODS: StyleOption[] = [
  { value: 'dramatic', label: 'Dramatic', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'dramatic' },
  { value: 'dreamy', label: 'Dreamy', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'dreamy ethereal' },
  { value: 'energetic', label: 'Energetic', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'energetic vibrant' },
  { value: 'mysterious', label: 'Mysterious', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'mysterious fog' },
  { value: 'cheerful', label: 'Cheerful', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'cheerful bright' },
  { value: 'eerie', label: 'Eerie', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'eerie spooky' },
];

export const LIGHTING: StyleOption[] = [
  { value: 'soft', label: 'Soft', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'soft light' },
  { value: 'studio', label: 'Studio', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'studio lighting' },
  { value: 'neon', label: 'Neon', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'neon lights' },
  { value: 'dramatic', label: 'Dramatic', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'dramatic lighting' },
  { value: 'golden hour', label: 'Golden Hour', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'golden hour sunset' },
  { value: 'backlit', label: 'Backlit', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'backlit silhouette' },
];

export const COLOURS: StyleOption[] = [
  { value: 'vibrant', label: 'Vibrant', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'vibrant colors' },
  { value: 'monochromatic', label: 'Monochromatic', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'monochromatic black white' },
  { value: 'pastel', label: 'Pastel', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'pastel colors' },
  { value: 'earthy', label: 'Earthy', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'earth tones' },
  { value: 'warm', label: 'Warm', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'warm colors' },
  { value: 'cool', label: 'Cool', imageUrl: 'https://placehold.co/100x100.png', dataAiHint: 'cool colors' },
];
