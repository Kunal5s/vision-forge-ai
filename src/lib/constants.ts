
export const MODEL_GROUPS = [
  {
    label: "Premium Models (Google AI)",
    models: [
      { value: "google-imagen-3", label: "Google Imagen 3 XL Pro" },
      { value: "google-parti-cinema", label: "Google Parti Cinema" },
      { value: "google-flux-schnell", label: "FLUX 1-schnell MAX" },
      { value: "google-simulacra-qr", label: "Simulacra QR Art" },
    ],
    premium: true,
  },
  {
    label: "Stable Diffusion & Community Models",
    models: [
      { value: "stable-diffusion-3-medium", label: "Stable Diffusion 3 Medium" },
      { value: "stable-diffusion-xl-1.5", label: "Stable Diffusion XL 1.5+" },
      { value: "openjourney-v4-pro", label: "OpenJourney V4 Pro" },
      { value: "opendalle-v1.1", label: "OpenDalle V1.1" },
      { value: "animagine-xl-3.0", label: "Animagine XL 3.0" },
      { value: "spellbrew-v2-fantasy", label: "Spellbrew V2 Fantasy" },
      { value: "realvisxl-v4-uhd", label: "RealVisXL V4.0 UHD" },
      { value: "dreamshaper-8", label: "DreamShaper 8" },
      { value: "instruct-pix2pix", label: "Instruct Pix2Pix" },
      { value: "playground-v2.5-ultra", label: "Playground V2.5 Ultra" },
      { value: "dreamshaper-xl-turbo", label: "DreamShaper XL Turbo" },
      { value: "pixart-sigma-ultra", label: "PixArt-Σ Ultra" },
      { value: "kandinsky-3.0-elite", label: "Kandinsky 3.0 Elite" },
    ],
    premium: false,
  }
];

export const ALL_MODEL_VALUES = MODEL_GROUPS.flatMap(g => g.models.map(m => m.value)) as [string, ...string[]];

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
