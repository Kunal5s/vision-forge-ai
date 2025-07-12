
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

// This ensures the page is dynamically rendered, always fetching the latest articles.
export const dynamic = 'force-dynamic';

// All categories are fetched to build the complete archive
const ALL_CATEGORIES = Object.values(categorySlugMap);

async function AllArticlesList() {
    // We fetch all articles from all categories. 
    // getArticles is cached, so it won't re-fetch if data is already loaded for the same request.
    const allArticlesPromises = ALL_CATEGORIES.map(category => getArticles(category));
    const articlesByCategory = await Promise.all(allArticlesPromises);
    
    // Flatten the array of arrays into a single array of all articles
    const allArticles = articlesByCategory.flat();

    // Sort all articles by title for a consistent order.
    // In a real application, you might sort by a 'publishedDate' field if it existed.
    allArticles.sort((a, b) => a.title.localeCompare(b.title));

    // The ArticlesSection component will display all articles passed to it.
    return <ArticlesSection articles={allArticles} category="All Articles" />;
}

export default function BlogPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
                        Explore All Articles
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Your central hub for inspiration, tutorials, and insights on AI creativity. This is our complete, ever-growing archive.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <AllArticlesList />
                </Suspense>
            </section>
        </main>
    );
}
