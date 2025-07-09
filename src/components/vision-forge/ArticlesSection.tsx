
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    description: string;
}

const initialTopics = [
    'Artificial Intelligence in Healthcare',
    'The Future of Remote Work',
    'Sustainable Living Tips',
    'Beginner\'s Guide to Investing',
];

const ArticleSkeleton = () => (
    <Card className="flex flex-col overflow-hidden">
        <CardHeader className="p-0">
            <Skeleton className="aspect-video w-full" />
        </CardHeader>
        <CardContent className="p-6 flex-grow">
            <Skeleton className="h-5 w-1/4 mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-1" />
        </CardContent>
        <CardFooter className="p-6 pt-0">
            <Skeleton className="h-5 w-24" />
        </CardFooter>
    </Card>
);

export function ArticlesSection() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchArticles = useCallback(async (topics: string[]) => {
        setIsLoading(true);
        setArticles([]);

        try {
            const articlePromises = topics.map(topic =>
                fetch('/api/generate-article', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic }),
                }).then(async (res) => {
                    if (!res.ok) {
                        const errData = await res.json().catch(() => null); // Gracefully handle non-JSON responses
                        const errorMessage = errData?.details || errData?.error || `Request failed for topic: ${topic}`;
                        throw new Error(errorMessage);
                    }
                    return res.json();
                })
            );

            const results = await Promise.all(articlePromises);
            setArticles(results);

        } catch (error: any) {
            console.error("Failed to fetch articles:", error);
            toast({
                title: 'Error Generating Articles',
                description: error.message || 'Could not generate new articles. Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchArticles(initialTopics);
    }, [fetchArticles]);
    
    const handleRegenerate = () => {
         const newTopics = [
            'The Impact of 5G Technology',
            'Mental Health and Mindfulness',
            'The Rise of E-commerce',
            'Exploring Ancient Civilizations with AI',
         ];
         fetchArticles(newTopics);
    }

    return (
        <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Featured Articles
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Explore fresh insights on AI, creativity, and technology, generated just for you.
                    </p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => <ArticleSkeleton key={index} />)
                    ) : (
                        articles.map((article, index) => (
                            <Card key={index} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                                <CardHeader className="p-0">
                                    <div className="aspect-video relative">
                                        <Image
                                            src={article.image}
                                            alt={article.title}
                                            layout="fill"
                                            objectFit="cover"
                                            data-ai-hint={article.dataAiHint}
                                            className="transition-opacity duration-500 opacity-0"
                                            onLoadingComplete={(image) => image.classList.remove('opacity-0')}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 flex-grow">
                                    <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                                    <CardTitle className="text-lg font-semibold leading-snug mb-2">{article.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {article.description}
                                    </p>
                                </CardContent>
                                <CardFooter className="p-6 pt-0">
                                    <Link href="#" className="flex items-center text-sm font-semibold text-foreground hover:underline">
                                        Read More <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
                 {!isLoading && articles.length > 0 && (
                    <div className="text-center mt-12">
                        <Button onClick={handleRegenerate} disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Regenerate Articles
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
