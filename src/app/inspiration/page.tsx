
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';

export const metadata: Metadata = {
    title: 'Inspiration Articles | Imagen BrainAi',
    description: 'Find creative inspiration with AI-generated articles on art, design, and overcoming creative blocks.',
};

// This ensures the page is dynamically rendered, always fetching the latest articles.
export const dynamic = 'force-dynamic';

const CATEGORY_NAME = 'Inspiration';

async function ArticleList() {
    const articles = await getArticles(CATEGORY_NAME);
    return <ArticlesSection articles={articles} />;
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
