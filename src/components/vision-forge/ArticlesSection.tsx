
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Article } from '@/lib/articles';
import parse from 'html-react-parser';
import { categorySlugMap } from '@/lib/constants';

interface ArticlesSectionProps {
    articles: Article[];
}

export function ArticlesSection({ articles }: ArticlesSectionProps) {

    const createSnippet = (content: Article['articleContent'], length = 150) => {
        if (!content || !Array.isArray(content)) return '';
        const firstParagraph = content.find(item => item.type === 'p');
        let textToSnippet = firstParagraph ? firstParagraph.content : '';
        textToSnippet = textToSnippet.replace(/<[^>]*>?/gm, ''); 
        if (textToSnippet.length <= length) return textToSnippet;
        return textToSnippet.substring(0, length) + '...';
    }

    if (!articles || articles.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>No articles are available for this category at the moment.</p>
                <p className="text-sm mt-2">Content is generated automatically. Please check back later.</p>
            </div>
        )
    }

    const gridClasses = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

    return (
        <div className={cn("grid gap-8", gridClasses)}>
            {articles.map((article, index) => {
                const categorySlug = Object.entries(categorySlugMap).find(([, name]) => name === article.category)?.[0] || article.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                const articleUrl = `/${categorySlug}/${article.slug}`;

                const isNew = article.publishedDate && (new Date().getTime() - new Date(article.publishedDate).getTime()) < 7 * 24 * 60 * 60 * 1000;

                return (
                    <Card key={`${article.slug}-${index}`} className={cn("flex flex-col overflow-hidden transition-shadow hover:shadow-lg animate-breathing-glow relative")}>
                        {isNew && (
                            <Badge className="absolute top-2 right-2 bg-green-600 text-white z-10 border-green-700">New</Badge>
                        )}
                        <CardHeader className="p-0">
                            <Link href={articleUrl}>
                                <div className="aspect-video relative">
                                    <Image
                                        src={article.image}
                                        alt={article.title.replace(/<[^>]*>?/gm, '')}
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
                                <Link href={articleUrl} className={'hover:text-primary'}>
                                    {parse(article.title)}
                                </Link>
                            </CardTitle>
                            <p className="text-sm text-foreground">
                                {createSnippet(article.articleContent)}
                            </p>
                        </CardContent>
                        <CardFooter className="p-6 pt-0">
                            <Link 
                              href={articleUrl} 
                              className={'flex items-center text-sm font-semibold text-foreground hover:text-primary'}
                              title={"Read the full article"}
                            >
                                Read More <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
}
