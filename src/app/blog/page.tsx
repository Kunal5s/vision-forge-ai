
'use client';

import { getArticles } from '@/lib/articles';
import type { Article } from '@/lib/articles';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { categorySlugMap } from '@/lib/constants';
import { useSearchParams } from 'next/navigation';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';

export const dynamic = 'force-dynamic';

const ARTICLES_PER_PAGE = 12;

function AllArticlesList() {
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category');
    
    useEffect(() => {
        setIsLoading(true);
        const fetchArticles = async () => {
            const allCategories = Object.values(categorySlugMap);
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

    const filteredArticles = useMemo(() => {
        if (!categoryFilter) {
            return allArticles;
        }
        const categoryName = Object.entries(categorySlugMap).find(([slug]) => slug === categoryFilter)?.[1];
        if (!categoryName) return allArticles;
        return allArticles.filter(article => article.category === categoryName);
    }, [categoryFilter, allArticles]);
    
    // Reset to first page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter]);


    const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
    const paginatedArticles = filteredArticles.slice(
        (currentPage - 1) * ARTICLES_PER_PAGE,
        currentPage * ARTICLES_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading) {
        return <ArticlesSkeleton />;
    }

    if (!paginatedArticles || paginatedArticles.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground col-span-full">
                <p>No articles are available for this category at the moment.</p>
                <p className="text-sm mt-2">New articles are generated automatically. Please check back later.</p>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            <ArticlesSection articles={paginatedArticles} />
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(1, currentPage - 1)); }}
                                aria-disabled={currentPage === 1}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                            if (totalPages <= 7 || (page === 1) || (page === totalPages) || (page >= currentPage - 2 && page <= currentPage + 2)) {
                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink 
                                            href="#" 
                                            onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                                            isActive={currentPage === page}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            } else if ((page === currentPage - 3) || (page === currentPage + 3)) {
                                return <PaginationEllipsis key={page} />;
                            }
                            return null;
                        })}

                        <PaginationItem>
                            <PaginationNext 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(totalPages, currentPage + 1)); }}
                                aria-disabled={currentPage === totalPages}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
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
