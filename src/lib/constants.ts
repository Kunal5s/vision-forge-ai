
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

// NEW, UNIQUE TOPICS - 19 per category, for a total of 190.
export const featuredTopics = [
    'The Future of Creativity is a Human-AI Partnership',
    'AI as Your Personal Art Director: A New Paradigm',
    'Why Your Next Creative Breakthrough Will Involve an AI',
    'Mastering the Digital Canvas: AI for Modern Content Creators',
    'Generative AI: The Ultimate Catalyst for Disruptive Innovation',
    'Unlocking Synergies Between Human Intuition and Machine Learning',
    'The New Renaissance: How AI is Augmenting Creativity',
    'Navigating the AI Frontier for Unprecedented Artistic Expression',
    'Conceptualizing with AI: A Guide to Limitless Ideation',
    'The AI Co-Pilot: Revolutionizing the Modern Creative Workflow',
    'From Prompt to Masterpiece: The Evolution of Art',
    'AI-Driven Design: Crafting the Visuals of Tomorrow',
    'Harnessing Generative Models for a New Wave of Content',
    'The Collaborative Future of Artists and Artificial Intelligence',
    'Exploring the Symbiotic Relationship Between Creators and AI',
    'AI as a Tool for Expanding Human Imagination',
    'The Impact of Generative AI Across Creative Industries',
    'Redefining Artistry in the Age of Artificial Intelligence',
    'Generative AI: Bridging the Gap Between Idea and Execution'
];

export const promptsTopics = [
    'The Psychology of Prompting: Getting Inside the AI’s Mind',
    'From Simple to Sublime: A Masterclass in Prompt Layering',
    'Negative Prompts: The Surprising Art of Creative Subtraction',
    'Unlocking Hyper-Realism: Advanced Photorealistic Prompting Techniques',
    'The Art of Specificity: Crafting Prompts That Deliver',
    'Iterative Prompting: Refining Your Vision with Every Generation',
    'Beyond Keywords: Using Natural Language for Better Results',
    'The Weighted Word: How to Control Emphasis in Prompts',
    'A Deep Dive into Controlling Composition Through Prompts',
    'Mastering Light and Shadow: Advanced Lighting Prompts Explained',
    'The A-Z of Prompt Engineering for Visual Artists',
    'Troubleshooting Your Prompts: Why You Aren’t Getting Results',
    'The Storyteller’s Prompt: Crafting Narrative in a Single Line',
    'From Vague Ideas to Vivid Images: A Prompting Journey',
    'How to ‘Speak’ to an AI: The Language of Prompts',
    'The Prompting Playbook: Strategies for Consistent and Quality Outputs',
    'Deconstructing Prompts: Learning from the Best AI Artists',
    'The Role of Temperature and Seed in Prompting',
    'Advanced Prompting: Combining Multiple Concepts with Precision'
];

export const stylesTopics = [
    'Beyond the Preset: Forging Your Unique AI Artistic Signature',
    'Cinematic Storytelling: How to Replicate Movie Stills with AI',
    'Architectural Dreams: Building Impossible Structures with AI Prompts',
    'A Fusion of Eras: Blending Historical Art Styles with AI',
    'The Style Mashup: Creating New Aesthetics with AI',
    'From Anime to Photorealism: A Guide to Art Styles',
    'Exploring Abstract Art Through the Lens of AI',
    'How to Develop a Consistent Style Across an AI Collection',
    'The AI Stylist: A Look at Fashion and Design',
    'Gothic, Brutalist, Art Deco: A Guide to Architectural Styles',
    'Recreating Classic Art Mediums: Watercolor, Oil, and Charcoal',
    'The Language of Film Noir: Crafting a Moody Aesthetic',
    'Cyberpunk, Steampunk, Solarpunk: A Guide to Punk Aesthetics',
    'Mastering the Minimalist Style in AI Image Generation',
    'A Deep Dive into Fantasy Art Styles and Tropes',
    'The Global Palette: Exploring Non-Western Art Styles with AI',
    'Vehicle Design with AI: From Concept Cars to Spaceships',
    'Understanding and Applying Color Theory in Your AI Art',
    'The Power of Texture: Adding Depth to Your AI Styles'
];

export const tutorialsTopics = [
    'Your First 10 AI Images: A Step-by-Step Walkthrough',
    'The Ultimate Guide to Fixing Hands, Eyes, and Faces',
    'From Chaos to Control: Mastering Inpainting and Outpainting',
    'Creating Professional Ad Creatives from a Single Prompt',
    'A Beginner’s Guide to AI Image Generation Platforms',
    'Setting Up Your Workflow for High-Volume AI Art Creation',
    'Upscaling Your AI Art: From Low-Res to Print-Ready',
    'How to Use Negative Prompts to Clean Up Your Images',
    'A Crash Course in Digital Color Correction for AI Art',
    'The Basics of Composition: Applying Classic Rules to AI',
    'Creating Custom Textures and Patterns with Generative AI',
    'A Guide to Using AI for Logo and Icon Design',
    'AI for Social Media: Creating a Month of Content',
    'From 2D Image to 3D Model: An Introductory Guide',
    'Animating Your AI Art: Simple Techniques for Motion',
    'How to Curate and Present Your AI Art Portfolio',
    'A Guide to the Different AI Models and Their Strengths',
    'Using AI to Generate Seamlessly Tiling Patterns',
    'A Tutorial on Blending AI Art with Your Own Photography'
];

export const storybookTopics = [
    'The Character Consistency Code: A Definitive AI Guide',
    'World-Building at Scale: Generating Maps, Cities, and Lore',
    'Panel by Panel: A Writer’s Guide to Creating Comics',
    'Directing Digital Actors: Prompting for Emotion and Expression',
    'The AI-Powered Children’s Book: A Step-by-Step Guide',
    'Creating Consistent Environments for Your Story’s Universe',
    'Visualizing Your Novel: Creating Chapter Art with AI',
    'AI for Tabletop RPGs: Generating Characters, Maps, and Items',
    'The Art of the Storyboard: Pre-Visualizing Your Film with AI',
    'Designing Fictional Creatures and Races with Generative AI',
    'Crafting a Visual Narrative: Pacing and Flow in AI Storytelling',
    'From Lore to Law: Designing Fictional Cultures with AI',
    'The AI Dungeon Master: A Guide to Visualizing Campaigns',
    'Prop Design: Creating Unique Artifacts for Your Story',
    'Fashion and Costume Design for Fictional Characters',
    'Creating a Visual Script with AI-Generated Panels',
    'The Mood Board: Setting the Tone for Your Story',
    'From Single Image to Sequence: A Mini-Guide to Animation',
    'Building an Art Bible for Your Fictional World'
];

export const usecasesTopics = [
    'AI-Powered Branding: Generating Logos and Style Guides Instantly',
    'The Indie Game Dev’s Secret Weapon for Concept Art',
    'Revolutionizing E-Commerce: AI for Product Mockups and Photoshoots',
    'How Interior Designers are Using AI for Virtual Staging',
    'AI in Education: Creating Custom Learning Materials',
    'The Architect’s Assistant: AI for Conceptual Design',
    'AI in Journalism: Visualizing Stories and Data',
    'Music and AI: Creating Album Art and Promotional Materials',
    'AI for Fashion: Prototyping Designs and Predicting Trends',
    'The Restaurateur’s Tool: AI for Menu Design and Food Photography',
    'AI in The-Film Industry: From Pitch to Post-Production',
    'How Event Planners Use AI for Mood Boards and Concepts',
    'AI-Generated Assets for Web Design and Development',
    'The Author’s Best Friend: AI for Book Cover Design',
    'AI in Healthcare: Visualizing Medical Concepts for Patients',
    'How Non-Profits Can Use AI for Impactful Storytelling',
    'AI for Product Design: Iterating on Ideas in Seconds',
    'The Theatre Director’s Aid: AI for Set and Costume Design',
    'AI in Marketing: Generating Endless Ad Campaign Creatives'
];

export const inspirationTopics = [
    'The AI Muse: Shattering Creative Blocks with Infinite Ideas',
    'Rediscovering History’s Lost Art Through AI-Powered Visualizations',
    'The Beauty of the Bizarre: A Guide to Surrealism',
    'Nature Reimagined: Creating Impossible Flora and Fauna with AI',
    'Dreamscapes: Bringing Your Most Vivid Dreams to Life',
    'Abstract Expressionism in the Digital Age: An AI Exploration',
    'Mythology Reborn: Visualizing Ancient Gods and Monsters',
    'The Poetry of Prompts: Finding Art in Language',
    'Daily AI Challenges: A Month of Creative Prompts',
    'Collaborating with the AI: A Guide to ‘Happy Accidents’',
    'The Beauty of Glitch Art: Embracing AI’s Imperfections',
    'Exploring Afrofuturism and Other Visionary Art Movements',
    'From Micro to Macro: Visualizing the Universe with AI',
    'The Emotional Power of Color: An AI Mood Study',
    'Conceptual Art with AI: Ideas Above Aesthetics',
    'Finding Inspiration in Everyday Objects with Generative AI',
    'The Art of the Unseen: Visualizing Sounds and Smells',
    'A Journey Through Fictional History with AI Art',
    'Remixing Reality: A Guide to AI-Powered Photo Manipulation'
];

export const trendsTopics = [
    'Text-to-Video: How AI is Animating the Future of Media',
    'The Ethics of Style: Using Artist Names in Prompts',
    'AI in the Metaverse: The Infinite Engine of Creation',
    'The Rise of the AI-Human Creative Team in Agencies',
    'The Future of 3D: Generative Models for Meshes and Textures',
    'AI and Copyright: The Great Legal Debate of Our Time',
    'Personalized Media: The Rise of AI-Generated Content for One',
    'The Open-Source AI Art Movement: A Cambrian Explosion',
    'On-Device AI: The Future of Instant, Private Generation',
    'Multi-Modal AI: Models That See, Hear, and Speak',
    'The Job Market of Tomorrow: New Creative Roles in AI',
    'AI for Good: Using Generative Art for Social Causes',
    'The Coming Battle Over AI Training Data and Consent',
    'Real-Time Generation: The Future of Interactive Art',
    'The Uncanny Valley: AI’s Quest for Perfect Human Realism',
    'AI Agents: The Next Step Beyond Simple Generation',
    'The Impact of Generative AI on the Stock Photo Industry',
    'AI Governance: Who Decides the Rules for Artificial Creativity?',
    'The Evolution of Prompting: From Keywords to Conversation'
];

export const technologyTopics = [
    'A Beginner’s Guide to How Diffusion Models Actually Work',
    'Latent Space Explained: The ‘Mind’ of the AI Model',
    'The Hardware Behind the Magic: GPUs, TPUs, and AI',
    'From GANs to Diffusion: The Evolution of Generative AI',
    'Understanding Transformers: The ‘T’ in ChatGPT and AI Art',
    'The Role of Text Encoders: How AI Understands Your Prompt',
    'Fine-Tuning vs. Dreambooth: Customizing Your Own AI Model',
    'A Look at LoRAs: Low-Rank Adaptation for Style Control',
    'The Math Behind the Magic: A Gentle Introduction to AI',
    'What is a Neural Network? A Simple Explanation',
    'The Importance of Datasets: Garbage In, Garbage Out',
    'ControlNet: The Revolutionary Tool for Compositional Control',
    'A Deep Dive into Different Samplers: Euler, DPM++, etc.',
    'The Future of AI Architectures: Beyond the Transformer',
    'How AI Models are Trained: A Cost and Time Analysis',
    'The Open-Source Stack: A Guide to Running AI Locally',
    'AI Safety and Alignment: Preventing Unintended Consequences',
    'Measuring AI Progress: Benchmarks and Leaderboards',
    'The Energy Question: The Carbon Footprint of AI Training'
];

export const nftTopics = [
    'The Artist’s Guide to Minting a Successful NFT Collection',
    'Beyond the JPEG: Exploring Utility and Gaming in NFTs',
    'Proof-of-Stake vs. Proof-of-Work: The New Green NFT',
    'Community is Everything: How to Market Your NFT Project',
    'The Generative Art NFT: From Art Blocks to Today',
    'A Guide to NFT Marketplaces: OpenSea, Magic Eden, etc.',
    'Smart Contracts for Artists: A Beginner’s Introduction',
    'The On-Chain vs. Off-Chain Debate for NFT Art Storage',
    'How to Price Your NFT Art: Strategies for Success',
    'Building a Long-Term Roadmap for Your NFT Project',
    'The Role of Curation in the NFT Art World',
    'Navigating Royalties: How Artists Get Paid on Secondary Sales',
    'Avoiding Scams and Staying Safe in the Web3 World',
    'The Future of Digital Identity: PFPs and Avatars',
    'What Is the Metaverse and How Do NFTs Fit In?',
    'A Look at Different Blockchains for Minting NFTs',
    'The Legal Side of NFTs: Copyright and Ownership Explained',
    'How to Build and Engage a Community on Discord',
    'The Psychology of Collecting in the NFT Space'
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

    