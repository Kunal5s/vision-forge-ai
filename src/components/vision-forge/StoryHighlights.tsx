
'use client';

import type { Story } from '@/lib/stories';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface StoryHighlightsProps {
    stories: Story[];
}

export function StoryHighlights({ stories }: StoryHighlightsProps) {

    if (!stories || stories.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>No stories have been generated yet.</p>
                <p className="text-sm mt-2">Come back later to see the latest visual stories!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stories.map((story) => (
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <CardContent className="absolute bottom-0 p-4 w-full">
                                <h3 className="text-sm font-bold text-white leading-tight drop-shadow-md line-clamp-3">
                                    {story.title}
                                </h3>
                                <p className="text-xs text-white/80 mt-1">{format(new Date(story.publishedDate), 'MMM d, yyyy')}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
             <div className="text-center mt-8">
                <Button asChild variant="outline">
                    <Link href="/stories">
                        View All Stories <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
