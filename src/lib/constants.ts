// A curated list of reliable and high-quality Hugging Face models.
// I have updated this list to include newer, faster, and more reliable models
// to ensure a better and more consistent generation experience.
export const HF_MODELS = [
  { value: 'stabilityai/stable-diffusion-xl-base-1.0', label: 'Stable Diffusion XL 1.0' },
  { value: 'playgroundai/playground-v2.5-1024px-aesthetic', label: 'Playground v2.5' },
  { value: 'RunDiffusion/Juggernaut-XL-v9', label: 'Juggernaut XL v9 (New)' },
  { value: 'cagliostrolab/animagine-xl-3.1', label: 'Animagine XL 3.1 (Anime)' },
  { value: 'segmind/SSD-1B', label: 'Segmind SSD-1B (Fast)' },
  { value: 'kandinsky-community/kandinsky-3', label: 'Kandinsky 3' },
];


export const GOOGLE_MODELS = [
  { value: "googleai/gemini-2.0-flash-preview-image-generation", label: "Google AI (Premium)" },
];

export const MODEL_GROUPS = [
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

export const ALL_MODEL_VALUES = [...HF_MODELS.map(m => m.value), ...GOOGLE_MODELS.map(m => m.value)] as [string, ...string[]];

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
