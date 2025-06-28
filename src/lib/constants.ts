

export const HF_MODELS = [
  { value: 'stabilityai/stable-diffusion-xl-base-1.0', label: 'Stable Diffusion XL 1.5+' },
  { value: 'stabilityai/stable-diffusion-3-medium-diffusers', label: 'Stable Diffusion 3 Medium' },
  { value: 'prompthero/openjourney-v4', label: 'OpenJourney V4 Pro' },
  { value: 'dataautogpt3/OpenDalleV1.1', label: 'OpenDalle V1.1' },
  { value: 'cagliostrolab/animagine-xl-3.0', label: 'Animagine XL 3.0 (Anime)' },
  { value: 'gsgen/reliberate', label: 'Spellbrew V2 Fantasy' },
  { value: 'sgm-lektra/realvisxl-v4.0', label: 'RealVisXL V4.0 UHD' },
  { value: 'lykon/dreamshaper-8', label: 'DreamShaper 8 Photorealistic' },
  { value: 'playgroundai/playground-v2.5-1024px-aesthetic', label: 'Playground V2.5 Ultra' },
  { value: 'Lykon/dreamshaper-xl-turbo', label: 'DreamShaper XL Turbo' },
  { value: 'PixArt-alpha/PixArt-Sigma-XL-2-1024-MS', label: 'PixArt-Σ Ultra' },
  { value: 'kandinsky-community/kandinsky-3', label: 'Kandinsky 3.0 Elite' },
];


export const GOOGLE_MODELS = [
  { value: "google-imagen-3", label: "Google Imagen 3 XL Pro" },
  { value: "google-parti-cinema", label: "Google Parti Cinema" },
  { value: "google-flux-schnell", label: "FLUX 1-schnell MAX" },
  { value: "google-simulacra-qr", label: "Simulacra QR Art" },
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
