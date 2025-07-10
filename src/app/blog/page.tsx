
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { categorySlugMap } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Blog | All Articles from Imagen BrainAi',
    description: 'Explore all articles from every category on Imagen BrainAi. Find inspiration, tutorials, and insights on AI image generation, creative prompts, and artistic styles.',
};

const CATEGORIES = Object.values(categorySlugMap);

async function AllArticlesList() {
    // We fetch all articles from all categories. 
    // getArticles is cached, so it won't re-fetch if data is already loaded.
    const allArticlesPromises = CATEGORIES.map(category => getArticles(category));
    const articlesByCategory = await Promise.all(allArticlesPromises);
    const allArticles = articlesByCategory.flat();

    // Sort all articles by title for a consistent order, you can change this to date later.
    allArticles.sort((a, b) => a.title.localeCompare(b.title));

    return <ArticlesSection articles={allArticles} category="All Articles" />;
}

export default function BlogPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
                        All Articles
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Your central hub for inspiration, tutorials, and insights on AI creativity.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <AllArticlesList />
                </Suspense>
            </section>
        </main>
    );
}
