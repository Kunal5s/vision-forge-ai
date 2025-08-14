
'use client';

import { getAllArticlesAdmin, type Article } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditArticlesClientPage from '@/components/vision-forge/EditArticlesClientPage';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditArticlesPage() {
    const [content, setContent] = useState<{
        published: { category: string, articles: Article[] }[],
        drafts: Article[]
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            const categories = Object.values(categorySlugMap);
            const publishedArticlesData = await Promise.all(
                categories.map(async (categoryName) => {
                    const articles = await getAllArticlesAdmin(categoryName);
                    return { category: categoryName, articles: articles.filter(a => a.status === 'published') };
                })
            );
            
            const draftArticles = await getAllArticlesAdmin('drafts');

            setContent({
                published: publishedArticlesData.filter(data => data.articles.length > 0),
                drafts: draftArticles,
            });
            setIsLoading(false);
        };
        
        fetchContent();
    }, []);

    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
            <div className="mb-8">
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            
            {isLoading || !content ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            ) : (
                <EditArticlesClientPage
                    publishedArticlesByCategory={content.published}
                    draftArticles={content.drafts}
                />
            )}
        </main>
    );
}
