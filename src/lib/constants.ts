
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
