
// A curated list of reliable and high-quality Hugging Face models.
export const HF_MODELS = [
  { value: 'runwayml/stable-diffusion-v1-5', label: 'Stable Diffusion v1.5' },
  { value: 'stabilityai/sdxl-turbo', label: 'SDXL Turbo (Ultra-fast)' },
  { value: 'prompthero/openjourney', label: 'OpenJourney (Artistic)' },
  { value: 'Linaqruf/anything-v3.0', label: 'Anything v3 (Anime)' },
  { value: 'SG161222/Realistic_Vision_V5.1', label: 'Realistic Vision v5.1' },
];

export const GOOGLE_MODELS = [
  { value: "googleai/gemini-2.0-flash-preview-image-generation", label: "Google AI (Premium)" },
];

export const POLLINATIONS_MODELS = [
  { value: 'pollinations', label: 'Pollinations AI (Fast)' },
];

export const STABLE_HORDE_MODELS = [
  { value: 'stable_horde', label: 'Stable Horde (Community)' },
];

export const MODEL_GROUPS = [
  {
    label: "Community Models (Free)",
    models: [...POLLINATIONS_MODELS, ...STABLE_HORDE_MODELS],
    premium: false,
  },
  {
    label: "Standard Models (Hugging Face)",
    models: HF_MODELS,
    premium: false,
  },
  {
    label: "Premium Models (Google AI)",
    models: GOOGLE_MODELS,
    premium: true,
  }
];

export const ALL_MODEL_VALUES = [
    ...POLLINATIONS_MODELS.map(m => m.value),
    ...STABLE_HORDE_MODELS.map(m => m.value),
    ...HF_MODELS.map(m => m.value), 
    ...GOOGLE_MODELS.map(m => m.value)
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

export const STYLES = [
  "None", "3D", "8-bit", "Analogue", "Anime", "Cartoon", "Collage", "Cookie", "Crayon", "Doodle", "Dough", "Felt", "Illustrated", "Marker", "Mechanical", "Painting", "Paper", "Pin", "Plushie", "Realistic", "Tattoo", "Woodblock"
];

export const MOODS = [
  "None", "Sweets", "Classical", "Cyberpunk", "Dreamy", "Glowy", "Gothic", "Kawaii", "Mystical", "Trippy", "Tropical", "Steampunk", "Wasteland"
];

export const LIGHTING_OPTIONS = [
  "None", "Bright", "Dark", "Neon", "Sunset", "Misty", "Ethereal"
];

export const COLOR_OPTIONS = [
  "None", "Cool", "Earthy", "Indigo", "Infrared", "Pastel", "Warm"
];

export type StyleType = typeof STYLES[number];
export type MoodType = typeof MOODS[number];
export type LightingType = typeof LIGHTING_OPTIONS[number];
export type ColorType = typeof COLOR_OPTIONS[number];
