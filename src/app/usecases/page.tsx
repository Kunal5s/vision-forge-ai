
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';

export const metadata: Metadata = {
    title: 'Use Cases | Imagen BrainAi',
    description: 'Discover the practical applications of AI image generation in marketing, gaming, design, and more.',
};

const usecasesTopics = [
    'How AI Image Generation is Revolutionizing Digital Marketing',
    'Creating Rapid Concept Art for Video Games with AI',
    'The Use of AI in Modern Architectural Visualization Projects',
    'A Guide to AI-Assisted Product Design and Prototyping',
];

async function ArticleList() {
    const articles = await getArticles('Usecases', usecasesTopics);
    return <ArticlesSection articles={articles} topics={usecasesTopics} category="Use Cases" />;
}

export default function UsecasesPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Practical AI Applications
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Explore how AI image generation is being used across different industries to drive innovation.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <ArticleList />
                </Suspense>
            </section>
        </main>
    );
}
