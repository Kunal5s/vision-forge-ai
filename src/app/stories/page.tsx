
import { getStories } from '@/lib/stories';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Web Stories | Imagen BrainAi',
    description: 'Explore engaging, visual web stories created with AI. A new way to discover content on Imagen BrainAi.',
};

export const dynamic = 'force-dynamic';

async function AllStoriesList() {
    // For now, we only have one category of stories: 'featured'
    const stories = await getStories('featured');

    if (!stories || stories.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>No stories are available at the moment.</p>
                <p className="text-sm mt-2">New stories are generated automatically. Please check back later.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stories.map((story) => (
                <Link key={story.slug} href={`/stories/${story.slug}`} className="block group">
                    <Card className="overflow-hidden h-full transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                        <CardHeader className="p-0">
                            <div className="aspect-[9/16] relative">
                                <Image
                                    src={story.cover}
                                    alt={story.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint={story.dataAiHint}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                        </CardHeader>
                        <CardContent className="absolute bottom-0 p-4">
                            <h3 className="text-sm font-bold text-white leading-tight drop-shadow-md">
                                {story.title}
                            </h3>
                        </CardContent>
                    </Card>
                </Link>
            ))}
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
