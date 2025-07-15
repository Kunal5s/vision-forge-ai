
export interface StyleOption {
  value: string;
  label: string;
}

export const ASPECT_RATIOS: StyleOption[] = [
  { label: 'Square (1:1)', value: '1:1' },
  { label: 'Widescreen (16:9)', value: '16:9' },
  { label: 'Portrait (9:16)', value: '9:16' },
  { label: 'Standard (4:3)', value: '4:3' },
  { label: 'Photography (3:2)', value: '3:2' },
  { label: 'Cinematic (21:9)', value: '21:9' },
];

export const ARTISTIC_STYLES: StyleOption[] = [
    { label: 'Photographic', value: 'photographic' },
    { label: 'Digital Art', value: 'digital art' },
    { label: 'Anime', value: 'anime style' },
    { label: 'Fantasy Art', value: 'fantasy art' },
    { label: 'Sci-Fi Concept', value: 'sci-fi concept art' },
    { label: 'Cartoon', value: 'cartoon style' },
    { label: '3D Render', value: '3d render' },
    { label: 'Watercolor', value: 'watercolor painting' },
    { label: 'Oil Painting', value: 'oil painting' },
    { label: 'Charcoal Sketch', value: 'charcoal sketch' },
    { label: 'Pixel Art', value: 'pixel art' },
    { label: 'None', value: 'none' },
];

export const MOODS: StyleOption[] = [
    { label: 'None', value: 'none' },
    { label: 'Mysterious', value: 'mysterious mood' },
    { label: 'Cheerful', value: 'cheerful mood' },
    { label: 'Dramatic', value: 'dramatic mood' },
    { label: 'Calm', value: 'calm mood' },
    { label: 'Energetic', value: 'energetic mood' },
    { label: 'Whimsical', value: 'whimsical' },
    { label: 'Gloomy', value: 'gloomy mood' },
    { label: 'Romantic', value: 'romantic mood' },
];

export const LIGHTING_OPTIONS: StyleOption[] = [
    { label: 'None', value: 'none' },
    { label: 'Soft', value: 'soft lighting' },
    { label: 'Dramatic', value: 'dramatic lighting' },
    { label: 'Cinematic', value: 'cinematic lighting' },
    { label: 'Studio', value: 'studio lighting' },
    { label: 'Natural', value: 'natural lighting' },
    { label: 'Neon', value: 'neon lighting' },
    { label: 'Backlit', value: 'backlit' },
    { label: 'Golden Hour', value: 'golden hour lighting' },
];

export const COLOR_PALETTES: StyleOption[] = [
    { label: 'Default', value: 'none' },
    { label: 'Vibrant', value: 'vibrant color palette' },
    { label: 'Monochrome', value: 'monochrome' },
    { label: 'Pastel', value: 'pastel colors' },
    { label: 'Earthy Tones', value: 'earthy tones' },
    { label: 'Muted Colors', value: 'muted colors' },
    { label: 'Warm Tones', value: 'warm tones' },
    { label: 'Cool Tones', value: 'cool tones' },
];

export const QUALITY_OPTIONS: StyleOption[] = [
    { label: 'Standard (1080p)', value: 'standard quality, 1080p' },
    { label: 'High (4K)', value: 'high quality, 4k, ultra detailed' },
    { label: 'Basic (720p)', value: 'basic quality, 720p' },
];

// --- ARTICLE GENERATOR CONSTANTS ---

export const OPENROUTER_MODELS: string[] = [
    "google/gemma-2-9b-it", // Recommended free model
    "openrouter/mistral-7b-instruct-free", // Fast free model
    "microsoft/phi-3-mini-128k-instruct", // Good small model
    "cognitivecomputations/dolphin-mixtral-8x7b",
    "google/gemma-7b-it",
    "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
    "mistralai/mistral-7b-instruct",
    "nousresearch/nous-hermes-2-mistral-7b-dpo",
    "huggingfaceh4/zephyr-7b-beta",
];


export const WRITING_STYLES: StyleOption[] = [
    { label: 'SEO Optimized', value: 'SEO Optimized and informative' },
    { label: 'Narrative Storytelling', value: 'Narrative and engaging' },
    { label: 'Journalistic', value: 'Journalistic and objective' },
    { label: 'Technical & In-Depth', value: 'Technical and detailed' },
    { label: 'Casual & Blog-like', value: 'Casual and conversational' },
];

export const ARTICLE_MOODS: StyleOption[] = [
    { label: 'Professional', value: 'Professional and authoritative' },
    { label: 'Humorous', value: 'Humorous and witty' },
    { label: 'Inspirational', value: 'Inspirational and uplifting' },
    { label: 'Serious & Formal', value: 'Serious and formal' },
    { label: 'Excited & Passionate', value: 'Excited and passionate' },
];

export const WORD_COUNTS: StyleOption[] = [
    { label: 'Short (~1500 words)', value: '1500' },
    { label: 'Medium (~3000 words)', value: '3000' },
    { label: 'Long (~5000 words)', value: '5000' },
    { label: 'Extra Long (~7000 words)', value: '7000' },
];


// Mapping slugs to category names for easy lookup
export const categorySlugMap: { [key: string]: string } = {
    'featured': 'Featured',
    'prompts': 'Prompts',
    'styles': 'Styles',
    'tutorials': 'Tutorials',
    'storybook': 'Storybook',
    'usecases': 'Usecases',
    'inspiration': 'Inspiration',
    'trends': 'Trends',
    'technology': 'Technology',
    'nft': 'NFT'
};
