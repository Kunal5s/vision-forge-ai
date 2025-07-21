
'use client';

import { getStories } from '@/lib/stories';
import type { Story } from '@/lib/stories';
import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { StoriesPageClient } from './StoriesPageClient';

function AllStoriesList() {
    const [allStories, setAllStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        setIsLoading(true);
        // Fetch stories from the primary category for now
        getStories('featured').then(stories => {
            stories.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
            setAllStories(stories);
            setIsLoading(false);
        });
    }, []);

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

    return <StoriesPageClient allStories={allStories} />;
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
