
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';

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

async function ArticleList() {
    const articles = await getArticles('Styles', stylesTopics);
    return <ArticlesSection articles={articles} topics={stylesTopics} category="Styles" />;
}

export default function StylesPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Explore Artistic Styles
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Dive deep into various artistic styles and learn how to replicate them with AI.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <ArticleList />
                </Suspense>
            </section>
        </main>
    );
}
