
export const categories = [
  'Portraits', 'Landscapes', 'Abstract', 'Fantasy', 
  'Animals', 'Sci-Fi', 'Architecture', 'Nature', 'Minimalism'
];

export interface Article {
  slug: string;
  title: string;
  category: string;
}

const createSlug = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

const portraitTitles = [
  "Mastering Emotional Depth in AI-Generated Photorealistic Portrait Photography",
  "The Unseen Artistry of Lighting in Advanced AI Portraits",
  "Achieving Stylistic Consistency Across a Series of AI Portraits",
  "From Classic Oil Paintings to AI: Reimagining Portrait Masters",
  "Beyond Realism: Crafting Expressive and Abstract AI Portrait Art",
  "Advanced Guide to Prompting for Diverse Ethnicities in Portraits",
];

const landscapeTitles = [
  "Crafting Epic, Otherworldly Vistas with AI Landscape Generation",
  "The Role of Atmospheric Effects in AI Landscape Art",
  "Generating Photorealistic Terrains: A Deep Dive into Prompt Engineering",
  "From Serene Sunsets to Stormy Seas: Capturing Mood Landscapes",
  "Architectural Wonders in Nature: Fusing Structures with AI Landscapes",
  "A Comparative Guide to Different AI Models for Landscapes",
];

const abstractTitles = [
  "Deconstructing Reality: A Guide to Abstract AI Art Generation",
  "The Symphony of Color and Form in AI Abstractism",
  "Translating Complex Emotions into Visually Compelling Abstract AI Art",
  "Exploring the Latent Space for Truly Unique Abstract Patterns",
  "Generative Abstract Art: From Chaotic Noise to Structured Beauty",
  "How to Curate a Cohesive Collection of AI Abstracts",
];

const fantasyTitles = [
  "World-Building with AI: Crafting Epic Fantasy Realms and Characters",
  "Designing Mythical Creatures with Advanced AI Image Generation Techniques",
  "The Ultimate Guide to Generating Enchanted Forests and Castles",
  "Forging Magical Artifacts and Weapons with AI Art Prompts",
  "Character Design: Creating Heroes and Villains for Fantasy Epics",
  "Storytelling Through a Single Image in AI Fantasy Art",
];

const animalTitles = [
  "Achieving Hyper-Realism in AI-Generated Wildlife Photography: A Masterclass",
  "The Art of Capturing Animal Personality in AI Portraits",
  "Creating Stylized and Anthropomorphic Animal Characters with AI Prompts",
  "From Fur to Feathers: A Guide to Textural Detailing",
  "The Secret to Dynamic Poses in AI Animal Art",
  "Photographing Mythical and Extinct Creatures with AI's Creative Power",
];

const scifiTitles = [
  "Designing Advanced Futuristic Cities with AI: A Comprehensive Tutorial",
  "Conceptualizing Next-Generation Spaceships and Vehicles with AI Prompts",
  "The Art of Cyberpunk: Mastering Neon-Soaked AI Cityscapes",
  "Creating Compelling Alien Species with AI Image Generation Tools",
  "From Dystopian Futures to Utopian Dreams in AI Art",
  "A Guide to Generating Detailed and Functional Sci-Fi UI",
];

const architectureTitles = [
  "Visualizing Impossible Structures: A Guide to Architectural AI Art",
  "The Fusion of Nature and Building in AI Architecture",
  "From Gothic Cathedrals to Futuristic Towers with AI Prompts",
  "Mastering Interior Design and Architectural Visualization Using AI Tools",
  "The Importance of Scale and Perspective in AI Architecture",
  "A Study of Deconstructivist and Parametric AI-Generated Architectural Forms",
];

const natureTitles = [
  "Capturing the Micro-Details of the Natural World with AI",
  "The Art of Botanical Illustration in the Age of AI",
  "Generating Stunning Underwater Scenes with AI Image Generation Techniques",
  "From Volcanic Eruptions to Glacial Plains with AI Prompts",
  "The Four Seasons: A Study in AI Nature Art",
  "How to Create Bioluminescent and Glowing Flora with AI",
];

const minimalismTitles = [
  "The Power of Simplicity: A Guide to Minimalist AI",
  "Finding Beauty in Negative Space with AI Art Generation",
  "Composing Striking Images with a Single Subject and Color",
  "Geometric Minimalism: A Study of Form and AI Generation",
  "How to Use Minimalist Prompts for Powerful, Evocative Results",
  "The Intersection of Japanese Wabi-Sabi and AI Minimalist Art",
];


export const articles: Record<string, Article[]> = {
  portraits: portraitTitles.map(title => ({ title, slug: createSlug(title), category: 'Portraits' })),
  landscapes: landscapeTitles.map(title => ({ title, slug: createSlug(title), category: 'Landscapes' })),
  abstract: abstractTitles.map(title => ({ title, slug: createSlug(title), category: 'Abstract' })),
  fantasy: fantasyTitles.map(title => ({ title, slug: createSlug(title), category: 'Fantasy' })),
  animals: animalTitles.map(title => ({ title, slug: createSlug(title), category: 'Animals' })),
  'sci-fi': scifiTitles.map(title => ({ title, slug: createSlug(title), category: 'Sci-Fi' })),
  architecture: architectureTitles.map(title => ({ title, slug: createSlug(title), category: 'Architecture' })),
  nature: natureTitles.map(title => ({ title, slug: createSlug(title), category: 'Nature' })),
  minimalism: minimalismTitles.map(title => ({ title, slug: createSlug(title), category: 'Minimalism' })),
};
