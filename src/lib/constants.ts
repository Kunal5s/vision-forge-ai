
export const PREMIUM_MODELS = [
  { value: 'googleai/gemini-2.0-flash-preview-image-generation', label: 'Google Imagen 3' },
];

export const FREE_MODELS = [
  { value: 'imagen-brain-ai', label: 'Imagen Brain AI' },
];

export const MODEL_GROUPS = [
  {
    label: "Free Models (Powered by Pexels)",
    models: FREE_MODELS,
    premium: false,
  },
  {
    label: "Premium Models (Subscribers Only)",
    models: PREMIUM_MODELS,
    premium: true,
  }
];

// This needs to include all possible model values for Zod validation.
export const ALL_MODEL_VALUES = [
  ...FREE_MODELS.map(m => m.value),
  ...PREMIUM_MODELS.map(m => m.value),
  // Keep old values here for compatibility
  'runwayml/stable-diffusion-v1-5',
  'stabilityai/sdxl-turbo',
  'prompthero/openjourney',
  'Linaqruf/anything-v3.0',
  'SG161222/Realistic_Vision_V5.1',
  'pollinations',
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
