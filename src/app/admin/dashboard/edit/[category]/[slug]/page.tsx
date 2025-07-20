
"use client";

import { notFound, useParams } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import EditArticleForm from './EditArticleForm';
import { getArticleForEdit } from './actions';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/articles';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditArticlePage() {
    const params = useParams<{ category: string; slug: string }>();
    const [article, setArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!params.category || !params.slug) return;
        
        const loadArticle = async () => {
            setIsLoading(true);
            try {
                const fetchedArticle = await getArticleForEdit(params.category, params.slug);
                if (fetchedArticle) {
                    setArticle(fetchedArticle);
                } else {
                    setError('Article not found.');
                }
            } catch (err) {
                setError('Failed to load article data.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadArticle();
    }, [params.category, params.slug]);

    if (isLoading) {
        return (
            <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </main>
        );
    }
    
    if (error || !article) {
        notFound();
    }
    
    // Determine the category name from the slug, or use the one from the article data.
    const categoryName = Object.entries(categorySlugMap).find(([slug]) => slug === params.category)?.[1] || article.category;


    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
           <EditArticleForm article={article} categorySlug={params.category} />
        </main>
    );
}
