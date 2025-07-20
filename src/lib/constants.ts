
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
    "moonshotai/kimi-k2:free",
    "google/gemma-2-9b-it",
    "qwen/qwen3-32b-chat",
    "qwen/qwen3-8b",
    "shisaai/shisa-v2-llama3-70b",
    "tencent/hunyuan-a13b-chat",
    "mistralai/mixtral-8x7b-instruct",
    "nousresearch/nous-hermes-2-mixtral",
    "cognitivecomputations/dolphin-2.9",
    "openchat/openchat-3.5",
    "huggingfaceh4/zephyr-7b-beta",
    "meta-llama/llama-3-8b-instruct",
    "openrouter/chronos-hermes-13b",
];

export const SAMBANOVA_MODELS: string[] = [
    "Llama-4-Maverick-17B-128E-Instruct",
    "DeepSeek-R1-0528",
    "DeepSeek-R1-Distill-Llama-70B",
    "Qwen3-32B",
    "DeepSeek-V3-0324",
    "Llama-3.3-Swallow-70B-Instruct-v0.4",
    "Meta-Llama-3.1-8B-Instruct",
    "Meta-Llama-3.3-70B-Instruct",
    "Whisper-Large-v3"
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
    { label: 'Very Long (~10000 words)', value: '10000' },
];

export const IMAGE_COUNTS: StyleOption[] = [
    { label: '1 Image', value: '1' },
    { label: '2 Images', value: '2' },
    { label: '3 Images', value: '3' },
    { label: '4 Images', value: '4' },
    { label: '5 Images', value: '5' },
    { label: '6 Images', value: '6' },
    { label: '7 Images', value: '7' },
    { label: '8 Images', value: '8' },
    { label: '9 Images', value: '9' },
    { label: '10 Images', value: '10' },
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


// --- WEB STORY CONSTANTS ---

export interface CaptionStyle {
    name: string;
    className: string;
}

export const CAPTION_STYLES: CaptionStyle[] = [
    { name: 'Classic Black', className: 'bg-black/60 text-white font-roboto p-3 rounded-lg' },
    { name: 'Minimal White', className: 'bg-white/80 text-black font-open-sans p-3 rounded-lg' },
    { name: 'Bold Uppercase', className: 'bg-transparent text-white font-oswald uppercase tracking-wider text-shadow-md' },
    { name: 'Elegant Script', className: 'bg-transparent text-white font-dancing-script text-3xl text-shadow-lg' },
    { name: 'Neon Glow', className: 'bg-transparent text-cyan-300 font-bebas-neue text-shadow-glow-cyan tracking-widest' },
    { name: 'Simple Lowercase', className: 'bg-transparent text-white font-lato lowercase' },
    { name: 'Subtle Shadow', className: 'bg-transparent text-white font-montserrat text-shadow-sm' },
    { name: 'Inverted Box', className: 'bg-white text-black font-roboto-condensed p-2 rounded-md' },
    { name: 'Yellow Highlight', className: 'bg-yellow-400 text-black font-bold font-anton p-2 mix-blend-screen' },
    { name: 'Red Outline', className: 'bg-transparent text-white font-anton uppercase text-shadow-outline-red' },
    { name: 'Handwritten Note', className: 'bg-transparent text-white font-indie-flower text-2xl' },
    { name: 'Blue Box', className: 'bg-blue-600/70 text-white font-source-sans p-3 rounded' },
    { name: 'Green Modern', className: 'bg-green-500/80 text-white font-raleway p-3' },
    { name: 'Playful Type', className: 'bg-pink-500 text-white font-pacifico text-2xl p-3 rounded-full' },
    { name: 'Formal Serif', className: 'bg-white/90 text-gray-800 font-playfair-display p-3' },
    { name: 'Muted Gray', className: 'bg-gray-700/60 text-gray-200 font-pt-sans p-2 rounded-sm' },
    { name: 'Condensed Tall', className: 'bg-black/50 text-white font-oswald tracking-wide p-2 uppercase' },
    { name: 'Light Shadow', className: 'bg-transparent text-black font-lato text-shadow-light' },
    { name: 'Purple Gradient', className: 'bg-gradient-to-r from-purple-600/70 to-pink-500/70 text-white font-montserrat p-3 rounded-lg' },
    { name: 'Caveat Brush', className: 'bg-transparent text-white font-caveat text-3xl text-shadow-md' },
];
    
