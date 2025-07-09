
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';


export const metadata: Metadata = {
    title: 'Storybook Articles | Imagen BrainAi',
    description: 'Learn how to use AI for visual storytelling, character design, and creating comic book panels.',
};

const storybookTopics = [
    'A Guide to Visual Storytelling with AI Image Generators',
    'Step-by-Step AI Character Design for Your Next Big Project',
    'Creating Dynamic and Engaging Scenes for Your Digital Storybook',
    'How to Generate Comic Book Panels Using AI Tools',
];

async function ArticleList() {
    const articles = await getArticles('Storybook', storybookTopics);
    return <ArticlesSection articles={articles} topics={storybookTopics} category="Storybook" />;
}

export default function StorybookPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        AI for Storytellers
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Bring your stories to life with guides on character design, scene creation, and visual narrative.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <ArticleList />
                </Suspense>
            </section>
        </main>
    );
}
