
'use client';

import { getStories } from '@/lib/stories';
import type { Story } from '@/lib/stories';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';

const STORIES_PER_PAGE = 12;

function AllStoriesList() {
    const [allStories, setAllStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category');

    useEffect(() => {
        setIsLoading(true);
        const fetchStories = async () => {
            const allCategoryNames = Object.values(categorySlugMap);
            const storyPromises = allCategoryNames.map(category => getStories(category));
            const storiesByCategory = await Promise.all(storyPromises);
            const flattenedStories = storiesByCategory.flat();
            
            flattenedStories.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
            setAllStories(flattenedStories);
            setIsLoading(false);
        };
        fetchStories();
    }, []);

    const filteredStories = useMemo(() => {
        if (!categoryFilter) {
            return allStories;
        }
        const categoryName = Object.entries(categorySlugMap).find(([slug]) => slug === categoryFilter)?.[1];
        if (!categoryName) return allStories;
        return allStories.filter(story => story.category === categoryName);
    }, [categoryFilter, allStories]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter]);

    const totalPages = Math.ceil(filteredStories.length / STORIES_PER_PAGE);
    const paginatedStories = filteredStories.slice(
        (currentPage - 1) * STORIES_PER_PAGE,
        currentPage * STORIES_PER_PAGE
    );
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden h-full aspect-[9/16] relative">
                         <Skeleton className="w-full h-full" />
                    </Card>
                ))}
            </div>
        )
    }

    if (!paginatedStories || paginatedStories.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground col-span-full">
                <p>No stories are available for this category at the moment.</p>
                <p className="text-sm mt-2">New stories are generated automatically. Please check back later.</p>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {paginatedStories.map((story) => (
                    <Link key={story.slug} href={`/stories/${story.slug}`} className="block group">
                        <Card className="overflow-hidden h-full transition-all group-hover:shadow-xl group-hover:-translate-y-1 aspect-[9/16] relative">
                            <Image
                                src={story.cover}
                                alt={story.title}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={story.dataAiHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <CardContent className="absolute bottom-0 p-3 w-full">
                                <h3 className="text-sm font-bold text-white leading-tight line-clamp-3 drop-shadow-md">
                                    {story.title}
                                </h3>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
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

export default function StoriesPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
                        Web Stories
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        A new, immersive way to experience content. Tap through our AI-generated visual stories.
                    </p>
                </header>
                <Suspense fallback={<div className="text-center">Loading stories...</div>}>
                    <AllStoriesList />
                </Suspense>
            </section>
        </main>
    );
}
