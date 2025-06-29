
export interface StyleOption {
  value: string;
  label: string;
}

// Changed label for clarity to indicate it's a search for real photos
export const PEXELS_MODELS = [
  { value: 'imagen-brain-ai', label: 'Pexels (Real Photos)' },
];

export const POLLINATIONS_MODELS = [
    { value: 'pollinations', label: 'Pollinations' }
];

export const STABLE_HORDE_MODELS = [
    { value: 'stable_horde', label: 'Stable Horde (Community)' }
];

export const MODEL_GROUPS = [
  {
    // Changed group label for clarity
    label: "Real Photos (Powered by Pexels)",
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
  }
];

// This needs to include all possible model values for Zod validation.
export const ALL_MODEL_VALUES = [
  ...PEXELS_MODELS.map(m => m.value),
  ...POLLINATIONS_MODELS.map(m => m.value),
  ...STABLE_HORDE_MODELS.map(m => m.value),
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
  { label: "2:1 (Wide)", value: "2:1" },
  { label: "3:1 (Panorama)", value: "3:1" },
  { label: "5:4 (Photo)", value: "5:4" },
];

export const STYLES: StyleOption[] = [
  { value: 'photographic', label: 'Photographic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'anime', label: 'Anime' },
  { value: 'fantasy art', label: 'Fantasy' },
  { value: '3d render', label: '3D Render' },
  { value: 'pixel art', label: 'Pixel Art' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'line art', label: 'Line Art' },
  { value: 'comic book', label: 'Comic Book' },
  { value: 'low poly', label: 'Low Poly' },
  { value: 'origami', label: 'Origami' },
  { value: 'sticker', label: 'Sticker' },
];

export const MOODS: StyleOption[] = [
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'dreamy', label: 'Dreamy' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'cheerful', label: 'Cheerful' },
  { value: 'eerie', label: 'Eerie' },
];

export const LIGHTING: StyleOption[] = [
  { value: 'soft', label: 'Soft' },
  { value: 'studio', label: 'Studio' },
  { value: 'neon', label: 'Neon' },
  { value: 'dramatic lighting', label: 'Dramatic' },
  { value: 'golden hour', label: 'Golden Hour' },
  { value: 'backlit', label: 'Backlit' },
];

export const COLOURS: StyleOption[] = [
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'earthy', label: 'Earthy' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
];
