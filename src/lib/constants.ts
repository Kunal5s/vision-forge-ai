
export interface StyleOption {
  value: string;
  label: string;
}

export const ASPECT_RATIOS = [
  { label: "1:1 (Square)", value: "1:1" },
  { label: "16:9 (Widescreen)", value: "16:9" },
  { label: "9:16 (Tall Portrait)", value: "9:16" },
  { label: "4:3 (Standard)", value: "4:3" },
  { label: "3:4 (Portrait)", value: "3:4" },
  { label: "3:2 (Photography)", value: "3:2" },
  { label: "2:3 (Portrait)", value: "2:3" },
  { label: "21:9 (Cinematic)", value: "21:9" },
  { label: "2:1 (Wide)", value: "2:1" },
  { label: "3:1 (Panorama)", value: "3:1" },
  { label: "5:4 (Photo)", value: "5:4" },
];

export const STYLES: StyleOption[] = [
  { value: '3d', label: '3D' },
  { value: '8-bit', label: '8-bit' },
  { value: 'analogue', label: 'Analogue' },
  { value: 'anime', label: 'Anime' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'collage', label: 'Collage' },
  { value: 'cookie', label: 'Cookie' },
  { value: 'crayon', label: 'Crayon' },
  { value: 'doodle', label: 'Doodle' },
  { value: 'dough', label: 'Dough' },
  { value: 'felt', label: 'Felt' },
  { value: 'illustrated', label: 'Illustrated' },
  { value: 'marker', label: 'Marker' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'painting', label: 'Painting' },
  { value: 'paper', label: 'Paper' },
  { value: 'pin', label: 'Pin' },
  { value: 'plushie', label: 'Plushie' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'tattoo', label: 'Tattoo' },
  { value: 'woodblock', label: 'Woodblock' },
];

export const MOODS: StyleOption[] = [
  { value: 'sweets', label: 'Sweets' },
  { value: 'classical', label: 'Classical' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'dreamy', label: 'Dreamy' },
  { value: 'glowy', label: 'Glowy' },
  { value: 'gothic', label: 'Gothic' },
  { value: 'kawaii', label: 'Kawaii' },
  { value: 'mystical', label: 'Mystical' },
  { value: 'trippy', label: 'Trippy' },
  { value: 'tropical', label: 'Tropical' },
  { value: 'steampunk', label: 'Steampunk' },
  { value: 'wasteland', label: 'Wasteland' },
];

export const LIGHTING: StyleOption[] = [
  { value: 'bright', label: 'Bright' },
  { value: 'dark', label: 'Dark' },
  { value: 'neon', label: 'Neon' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'misty', label: 'Misty' },
  { value: 'ethereal', label: 'Ethereal' },
];

export const COLOURS: StyleOption[] = [
  { value: 'cool', label: 'Cool' },
  { value: 'earthy', label: 'Earthy' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'infrared', label: 'Infrared' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'warm', label: 'Warm' },
];

export const MODELS = [
  {
    value: 'pollinations',
    label: 'Pollinations (Community)',
    type: 'free',
    description: 'A fast, community-supported model. Good for quick experiments. No credits required.'
  },
  {
    value: 'stabilityai/stable-diffusion-xl-base-1.0',
    label: 'Stable Diffusion XL',
    type: 'huggingface',
    description: 'A powerful and popular model from Stability AI for high-quality images. Requires credits.'
  },
  {
    value: 'runwayml/stable-diffusion-v1-5',
    label: 'Stable Diffusion 1.5',
    type: 'huggingface',
    description: 'A classic and versatile model. Less powerful than SDXL but faster. Requires credits.'
  },
  {
    value: 'gemini',
    label: 'Google Gemini Pro',
    type: 'gemini',
    description: 'State-of-the-art model from Google for highest quality and coherence. Requires credits.'
  }
];
