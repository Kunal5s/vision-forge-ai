
'use client';

import { getArticles } from '@/lib/articles';
import type { Article } from '@/lib/articles';
import { Suspense, useEffect, useState } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';
import { categorySlugMap } from '@/lib/constants';
import { BlogPageClient } from './BlogPageClient';

function AllArticlesList() {
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        setIsLoading(true);
        const fetchArticles = async () => {
            // Fetch articles from all categories EXCEPT 'Featured'
            const allCategories = Object.values(categorySlugMap).filter(name => name !== 'Featured');
            const articlePromises = allCategories.map(category => getArticles(category));
            const articlesByCategory = await Promise.all(articlePromises);
            const flattenedArticles = articlesByCategory.flat();
            
            flattenedArticles.sort((a, b) => {
                if (a.publishedDate && b.publishedDate) {
                    return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
                }
                return a.title.localeCompare(b.title);
            });
            setAllArticles(flattenedArticles);
            setIsLoading(false);
        };
        fetchArticles();
    }, []);

    if (isLoading) {
        return <ArticlesSkeleton />;
    }

    return <BlogPageClient allArticles={allArticles} />;
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
