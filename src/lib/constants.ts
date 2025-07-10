
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
    { label: 'Mysterious', value: 'mysterious mood' },
    { label: 'Cheerful', value: 'cheerful mood' },
    { label: 'Dramatic', value: 'dramatic mood' },
    { label: 'Calm', value: 'calm mood' },
    { label: 'Energetic', value: 'energetic mood' },
    { label: 'Whimsical', value: 'whimsical' },
    { label: 'Gloomy', value: 'gloomy mood' },
    { label: 'Romantic', value: 'romantic mood' },
    { label: 'None', value: 'none' },
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

// Topics for each category
export const featuredTopics = [
    'The Definitive Guide to Advanced Prompt Engineering for AI',
    'How AI Blurs the Lines Between Photography and Imagination',
    'Creating Consistent Characters: A Deep Dive into AI Storytelling',
    'Beyond Pretty Pictures: The Business Case for AI Generation',
];
export const promptsTopics = [
    'The Secret to Crafting Emotionally Resonant AI Art Prompts',
    'A Deep Dive into Advanced Prompt Weighting Techniques',
    'How to Use Negative Prompts to Eliminate Unwanted Elements',
    'From a Single Word to a Masterpiece: Prompt Expansion',
];
export const stylesTopics = [
    'How to Replicate Film Photography Styles Using AI Prompts',
    'A Guide to Creating Impossible Architecture with AI',
    'Exploring Abstract Expressionism with AI Image Generation Models',
    'How to Achieve a Perfect Flat Design Illustration Style',
];
export const tutorialsTopics = [
    'A Beginner’s Tutorial to Your First AI Masterpiece',
    'Tutorial: Fixing Distorted Faces and Hands in AI Art',
    'Advanced Image Editing Tutorial: AI Inpainting and Outpainting',
    'How to Create Stunning Product Mockups with AI',
];
export const storybookTopics = [
    'How to Create a Consistent Character for Your Storybook',
    'From Script to Panel: Visualizing Comic Book Scenes',
    'AI for World-Building: Generating Fantasy Maps and Environments',
    'Creating Emotional and Expressive Characters with AI Prompts',
];
export const usecasesTopics = [
    'How AI is Revolutionizing Ad Creatives and Marketing Campaigns',
    'Generating Endless Concept Art for Indie Game Development',
    'The Future of Architectural Visualization with AI-Powered Renderings',
    'Using AI for Fashion Design: From Mood Boards',
];
export const inspirationTopics = [
    'Overcoming Creative Block: Using AI as a Brainstorming Partner',
    'Finding Your Unique Artistic Style in the Age of AI',
    'Drawing Inspiration from History and Mythology for AI Creations',
    'Surrealism in the Digital Age: Creating Dream-Like Worlds',
];
export const trendsTopics = [
    'The Rise of AI-Generated Video: The Next Frontier',
    'Ethical AI: Navigating Copyright and Bias in Generative Art',
    'AI in the Metaverse: Shaping the Future of Worlds',
    'Hyper-Personalization: How AI is Tailoring Digital Experiences for You',
];
export const technologyTopics = [
    'How Diffusion Models Work: An Explanation of Text-to-Image',
    'The Evolution of AI Models: From GPT-2 to Now',
    'Understanding Latent Space: The Hidden Universe of AI Creativity',
    'The Role of Cloud Computing in Powering AI Models',
];
export const nftTopics = [
    'How to Create and Sell Your First AI NFT',
    'The Future of NFTs: Exploring Utility, Gaming, and Identity',
    'Understanding the Carbon Footprint of NFTs and Eco-Friendly Alternatives',
    'Marketing Your NFT Project: A Guide to Building Community',
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
