
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';

export const metadata: Metadata = {
    title: 'Trends Articles | Imagen BrainAi',
    description: 'Stay ahead of the curve with AI-generated articles on the latest trends in generative art and technology.',
};

const trendsTopics = [
    'The Biggest AI Art and Design Trends of This Year',
    'Understanding Diffusion Models: The Tech Behind Your Favorite AI',
    'The Important Ethical Considerations of Modern AI Art Generation',
    'What is the Future of Generative AI Technology Models',
];

async function ArticleList() {
    const articles = await getArticles('Trends', trendsTopics);
    return <ArticlesSection articles={articles} topics={trendsTopics} category="Trends" />;
}

export default function TrendsPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        The Future is Now
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Keep up with the fast-paced world of AI art with our articles on current and future trends.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <ArticleList />
                </Suspense>
            </section>
        </main>
    );
}
