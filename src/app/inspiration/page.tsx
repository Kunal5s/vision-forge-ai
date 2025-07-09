
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Inspiration Articles | Imagen BrainAi',
    description: 'Find creative inspiration with AI-generated articles on art, design, and overcoming creative blocks.',
};

const inspirationTopics = [
    'Overcoming Creative Blocks with AI-Powered Idea Generation Tools',
    'Building Fantasy Worlds: A Guide to AI-Assisted Creativity',
    'Exploring Abstract Art Concepts Using Generative AI Models',
    'How to Find Unique Inspiration in Everyday Life Scenes',
];

export default async function InspirationPage() {
    const articles = await getArticles('Inspiration', inspirationTopics);

    return (
        <main className="py-12">
            <ArticlesSection 
                articles={articles}
                topics={inspirationTopics} 
                category="Inspiration" 
                headline="Creative Inspiration Hub"
                subheadline="Fuel your next masterpiece with articles on creativity, idea generation, and artistic exploration."
            />
        </main>
    );
}
