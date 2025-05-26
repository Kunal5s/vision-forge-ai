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
  "3D", "8-bit", "Analogue", "Anime", "Cartoon", "Collage", "Cookie", 
  "Crayon", "Doodle", "Dough", "Felt", "Illustrated", "Marker", 
  "Mechanical", "Painting", "Paper", "Pin", "Plushie", "Realistic", 
  "Tattoo", "Woodblock"
];

export const MOODS = [
  "Sweets", "Classical", "Cyberpunk", "Dreamy", "Glowy", "Gothic", 
  "Kawaii", "Mystical", "Trippy", "Tropical", "Steampunk", "Wasteland"
];

export const LIGHTING_OPTIONS = [
  "Bright", "Dark", "Neon", "Sunset", "Misty", "Ethereal"
];

export const COLOR_OPTIONS = [
  "Cool", "Earthy", "Indigo", "Infrared", "Pastel", "Warm"
];

export type StyleType = typeof STYLES[number];
export type MoodType = typeof MOODS[number];
export type LightingType = typeof LIGHTING_OPTIONS[number];
export type ColorType = typeof COLOR_OPTIONS[number];
