
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Styles Articles | Imagen BrainAi',
    description: 'Explore different artistic styles with our AI-generated guides on photorealism, digital art, and more.',
};

const stylesTopics = [
    'Exploring the Most Popular Digital Art Styles in AI',
    'How to Master Photorealism in Your AI Art Generations',
    'Creating Authentic Vintage and Retro Effects with AI Prompts',
    'A Guide to Developing Your Own Unique AI Style',
];

export default async function StylesPage() {
    const articles = await getArticles('Styles', stylesTopics);
    return (
        <main className="py-12">
            <ArticlesSection 
                articles={articles}
                topics={stylesTopics} 
                category="Styles" 
                headline="Explore Artistic Styles"
                subheadline="Dive deep into various artistic styles and learn how to replicate them with AI."
            />
        </main>
    );
}
