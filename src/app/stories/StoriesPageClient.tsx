
'use client';

import type { Story } from '@/lib/stories';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';

const STORIES_PER_PAGE = 12;

interface StoriesPageClientProps {
    allStories: Story[];
}

export function StoriesPageClient({ allStories }: StoriesPageClientProps) {
    const [currentPage, setCurrentPage] = useState(1);
    
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category');

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
