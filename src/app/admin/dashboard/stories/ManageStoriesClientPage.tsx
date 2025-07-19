
'use client';

import type { Story } from '@/lib/stories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, FileText, Folder, Search, CheckCircle, Edit3, BookImage } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


interface ManageStoriesClientPageProps {
    allStoriesByCategory: { category: string, stories: Story[] }[];
}

export function ManageStoriesClientPage({ allStoriesByCategory }: ManageStoriesClientPageProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStories = useMemo(() => {
        if (!searchTerm) {
            return allStoriesByCategory;
        }
        
        const lowercasedFilter = searchTerm.toLowerCase();

        return allStoriesByCategory
            .map(categoryData => {
                const filtered = categoryData.stories.filter(story =>
                    story.title.toLowerCase().includes(lowercasedFilter) ||
                    story.slug.toLowerCase().includes(lowercasedFilter) ||
                    (story.status && story.status.toLowerCase().includes(lowercasedFilter))
                );
                return { ...categoryData, stories: filtered };
            })
            .filter(categoryData => categoryData.stories.length > 0);

    }, [searchTerm, allStoriesByCategory]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Story History</CardTitle>
                <CardDescription>
                    Here you can find all your web stories. Use the search bar to filter by title or status.
                </CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search stories..."
                        className="pl-10 w-full md:w-1/2 lg:w-1/3"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {filteredStories.length > 0 ? (
                    <div className="space-y-8">
                        {filteredStories.map(({ category, stories }) => (
                            <section key={category}>
                                <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4 border-b pb-2">
                                    <Folder className="h-6 w-6 text-primary" />
                                    {category}
                                </h2>
                                <div className="space-y-4">
                                    {stories.map(story => (
                                        <div key={story.slug} className="flex items-start md:items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors flex-wrap md:flex-nowrap">
                                            <Image
                                              src={story.cover}
                                              alt={story.title}
                                              width={80}
                                              height={142} // 9:16 aspect ratio
                                              className="rounded-md object-cover aspect-[9/16] shrink-0"
                                              data-ai-hint={story.dataAiHint}
                                            />
                                            <div className="flex-grow min-w-0">
                                                <h3 className="font-semibold text-lg text-foreground truncate" title={story.title}>{story.title}</h3>
                                                <div className="flex items-center gap-2 mt-1 mb-2 flex-wrap">
                                                     <Badge variant={story.status === 'published' ? 'default' : 'secondary'} className={cn(story.status === 'published' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600', 'text-white')}>
                                                        {story.status === 'published' ? <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : <Edit3 className="mr-1.5 h-3.5 w-3.5" />}
                                                        {story.status}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        Published: {format(new Date(story.publishedDate), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 hidden md:block">
                                                    {story.seoDescription}
                                                </p>
                                            </div>
                                            <Button asChild variant="secondary" size="sm" className="shrink-0 ml-auto">
                                                <Link href={`/admin/dashboard/stories/edit/${story.slug}`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <BookImage size={48} className="mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">No Web Stories Found</h3>
                        <p>{searchTerm ? "No stories found matching your search." : "It looks like there are no stories yet."}</p>
                        {!searchTerm && (
                            <Button asChild className="mt-4">
                                <Link href="/admin/dashboard/stories/create">Create New Story</Link>
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
