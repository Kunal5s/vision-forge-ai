
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';

export const metadata: Metadata = {
    title: 'Inspiration Articles | Imagen BrainAi',
    description: 'Find creative inspiration with AI-generated articles on art, design, and overcoming creative blocks.',
};

const inspirationTopics = [
    'AI Art as a Tool for Healing and Self-Expression',
    'How to Find and Develop Your Unique Artistic Voice',
    'Exploring Surrealism: Creating Dreamlike Worlds with AI Prompts',
    'Drawing Inspiration from Nature for Your AI Creations',
];

async function ArticleList() {
    const articles = await getArticles('Inspiration', inspirationTopics);
    return <ArticlesSection articles={articles} topics={inspirationTopics} category="Inspiration" />;
}

export default function InspirationPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Creative Inspiration Hub
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Fuel your next masterpiece with articles on creativity, idea generation, and artistic exploration.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <ArticleList />
                </Suspense>
            </section>
        </main>
    );
}
