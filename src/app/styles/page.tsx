
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';

export const metadata: Metadata = {
    title: 'Styles Articles | Imagen BrainAi',
    description: 'Explore different artistic styles with our AI-generated guides on photorealism, digital art, and more.',
};

// This ensures the page is dynamically rendered, always fetching the latest articles.
export const dynamic = 'force-dynamic';

const CATEGORY_NAME = 'Styles';

async function ArticleList() {
    const articles = await getArticles(CATEGORY_NAME);
    return <ArticlesSection articles={articles} category={CATEGORY_NAME} />;
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
