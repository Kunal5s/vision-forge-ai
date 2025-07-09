
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { regenerateFeaturedArticles } from '@/app/actions';

interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    slug: string;
    articleContent: string;
    keyTakeaways: string[];
    conclusion: string;
}

interface ArticlesSectionProps {
    articles: Article[];
    topics: string[];
    category: string;
    headline: string;
    subheadline: string;
    showRegenerate?: boolean;
}

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

export function ArticlesSection({ articles, topics, category, headline, subheadline, showRegenerate = false }: ArticlesSectionProps) {
    const { toast } = useToast();
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        toast({ title: 'Regenerating...', description: 'Fetching a fresh batch of articles. The page will refresh shortly.' });
        const result = await regenerateFeaturedArticles();
        if (result.success) {
            toast({ title: 'Success!', description: result.message });
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
        setIsRegenerating(false);
    };

    const createSnippet = (content: string, length = 150) => {
        if (!content) return '';
        if (content.length <= length) return content;
        return content.substring(0, length) + '...';
    }

    const isLoading = !articles || articles.length === 0;

    return (
        <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        {headline}
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        {subheadline}
                    </p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => <ArticleSkeleton key={index} />)
                    ) : (
                        articles.map((article, index) => {
                            const isFeaturedCategory = article.category === 'Featured';
                            const categorySlug = article.category.toLowerCase().replace(/\s+/g, '');
                            const articleUrl = isFeaturedCategory ? '#' : `/${categorySlug}/${article.slug}`;

                            return (
                                <Card key={index} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                                    <CardHeader className="p-0">
                                        <Link href={articleUrl} className={isFeaturedCategory ? 'pointer-events-none' : ''}>
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
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-6 flex-grow">
                                        <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                                        <CardTitle className="text-lg font-semibold leading-snug mb-2">
                                            <Link href={articleUrl} className={isFeaturedCategory ? 'pointer-events-none' : 'hover:underline'}>
                                                {article.title}
                                            </Link>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {createSnippet(article.articleContent)}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-6 pt-0">
                                        <Link 
                                          href={articleUrl} 
                                          className={`flex items-center text-sm font-semibold text-foreground ${isFeaturedCategory ? 'pointer-events-none text-muted-foreground' : 'hover:underline'}`}
                                          title={isFeaturedCategory ? "Full article view for featured items is under development." : "Read the full article"}
                                          onClick={(e) => isFeaturedCategory && e.preventDefault()}
                                        >
                                            Read More <ArrowRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </CardFooter>
                                </Card>
                            )
                        })
                    )}
                </div>
                 {showRegenerate && (
                    <div className="text-center mt-12">
                        <Button onClick={handleRegenerate} disabled={isRegenerating}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            Regenerate Articles
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
