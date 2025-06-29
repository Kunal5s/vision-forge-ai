
export const IMAGEN_BRAIN_AI_MODEL = [
  { value: 'imagen-brain-ai', label: 'Imagen Brain AI' },
];

export const MODEL_GROUPS = [
  {
    label: "Available Models",
    models: IMAGEN_BRAIN_AI_MODEL,
    premium: false,
  }
];

// This needs to include all possible model values for Zod validation.
export const ALL_MODEL_VALUES = [
  'imagen-brain-ai',
  // Keep old values here to prevent validation errors from history items if any exist,
  // but they won't be shown in the UI.
  "googleai/gemini-2.0-flash-preview-image-generation",
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
