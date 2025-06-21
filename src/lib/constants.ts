export const ASPECT_RATIOS = [
  { label: "1:1 (Square)", value: "1:1" },
  { label: "16:9 (Widescreen)", value: "16:9" },
  { label: "4:3 (Standard)", value: "4:3" },
  { label: "3:2 (Photography)", value: "3:2" },
  { label: "2:3 (Portrait)", value: "2:3" },
  { label: "9:16 (Tall Portrait)", value: "9:16" },
  { label: "5:4 (Landscape)", value: "5:4" },
  { label: "21:9 (Cinematic)", value: "21:9" },
  { label: "2:1 (Wide)", value: "2:1" },
  { label: "3:1 (Panorama)", value: "3:1" },
];

export const STYLES = [
  "None", "Photorealistic", "3D Render", "Anime", "Abstract", "Cartoon", "Oil Painting", "Cyberpunk", "Vintage", "Minimalist"
] as const;

export const MOODS = [
  "None", "Cinematic", "Dramatic", "Dreamy", "Eerie", "Energetic", "Mysterious", "Peaceful", "Romantic", "Whimsical"
] as const;

export const LIGHTING_OPTIONS = [
  "None", "Soft Lighting", "Bright", "Dark", "Dramatic Lighting", "Neon", "Studio Lighting", "Sunset", "Golden Hour"
] as const;

export const COLOR_OPTIONS = [
  "None", "Vibrant", "Monochromatic", "Pastel", "Cool Tones", "Warm Tones", "Black and White"
] as const;

export type StyleType = typeof STYLES[number];
export type MoodType = typeof MOODS[number];
export type LightingType = typeof LIGHTING_OPTIONS[number];
export type ColorType = typeof COLOR_OPTIONS[number];
