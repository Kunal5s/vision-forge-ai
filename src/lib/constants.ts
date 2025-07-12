
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

// NEW, UNIQUE TOPICS - 40 total
export const featuredTopics = [
    'The Future of Creativity is a Human-AI Partnership',
    'AI as Your Personal Art Director: A New Paradigm',
    'Why Your Next Creative Breakthrough Will Involve an AI',
    'Mastering the Digital Canvas: AI for Modern Content Creators',
];
export const promptsTopics = [
    'The Psychology of Prompting: Getting Inside the AI’s Mind',
    'From Simple to Sublime: A Masterclass in Prompt Layering',
    'Negative Prompts: The Surprising Art of Creative Subtraction',
    'Unlocking Hyper-Realism: Advanced Photorealistic Prompting Techniques',
];
export const stylesTopics = [
    'Beyond the Preset: Forging Your Unique AI Artistic Signature',
    'Cinematic Storytelling: How to Replicate Movie Stills with AI',
    'Architectural Dreams: Building Impossible Structures with AI Prompts',
    'A Fusion of Eras: Blending Historical Art Styles with AI',
];
export const tutorialsTopics = [
    'Your First 10 AI Images: A Step-by-Step Walkthrough',
    'The Ultimate Guide to Fixing Hands, Eyes, and Faces',
    'From Chaos to Control: Mastering Inpainting and Outpainting',
    'Creating Professional Ad Creatives from a Single Prompt',
];
export const storybookTopics = [
    'The Character Consistency Code: A Definitive AI Guide',
    'World-Building at Scale: Generating Maps, Cities, and Lore',
    'Panel by Panel: A Writer’s Guide to Creating Comics',
    'Directing Digital Actors: Prompting for Emotion and Expression',
];
export const usecasesTopics = [
    'AI-Powered Branding: Generating Logos and Style Guides Instantly',
    'The Indie Game Dev’s Secret Weapon for Concept Art',
    'Revolutionizing E-Commerce: AI for Product Mockups and Photoshoots',
    'How Interior Designers are Using AI for Virtual Staging',
];
export const inspirationTopics = [
    'The AI Muse: Shattering Creative Blocks with Infinite Ideas',
    'Rediscovering History’s Lost Art Through AI-Powered Visualizations',
    'The Beauty of the Bizarre: A Guide to Surrealism',
    'Nature Reimagined: Creating Impossible Flora and Fauna with AI',
];
export const trendsTopics = [
    'Text-to-Video: How AI is Animating the Future of Media',
    'The Ethics of Style: Using Artist Names in Prompts',
    'AI in the Metaverse: The Infinite Engine of Creation',
    'The Rise of the AI-Human Creative Team in Agencies',
];
export const technologyTopics = [
    'A Beginner’s Guide to How Diffusion Models Actually Work',
    'Latent Space Explained: The ‘Mind’ of the AI Model',
    'The Hardware Behind the Magic: GPUs, TPUs, and AI',
    'From GANs to Diffusion: The Evolution of Generative AI',
];
export const nftTopics = [
    'The Artist’s Guide to Minting a Successful NFT Collection',
    'Beyond the JPEG: Exploring Utility and Gaming in NFTs',
    'Proof-of-Stake vs. Proof-of-Work: The New Green NFT',
    'Community is Everything: How to Market Your NFT Project',
];

export const allTopicsByCategory: Record<string, string[]> = {
    'Featured': featuredTopics,
    'Prompts': promptsTopics,
    'Styles': stylesTopics,
    'Tutorials': tutorialsTopics,
    'Storybook': storybookTopics,
    'Usecases': usecasesTopics,
    'Inspiration': inspirationTopics,
    'Trends': trendsTopics,
    'Technology': technologyTopics,
    'NFT': nftTopics,
};

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
