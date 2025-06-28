

export const GOOGLE_MODELS = [
  { value: "google-imagen-3", label: "Google Imagen 3 XL Pro" },
  { value: "google-parti-cinema", label: "Google Parti Cinema" },
  { value: "google-flux-schnell", label: "FLUX 1-schnell MAX" },
  { value: "google-simulacra-qr", label: "Simulacra QR Art" },
];

export const MODEL_GROUPS = [
  {
    label: "Premium Models (Google AI)",
    models: GOOGLE_MODELS,
    premium: true,
  }
];

export const ALL_MODEL_VALUES = GOOGLE_MODELS.map(m => m.value) as [string, ...string[]];

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
