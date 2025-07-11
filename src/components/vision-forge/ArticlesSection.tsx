
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface ArticleContentBlock {
    type: 'h2' | 'h3' | 'p';
    content: string;
}

interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    slug: string;
    articleContent: ArticleContentBlock[] | string;
    keyTakeaways: string[];
    conclusion: string;
}

interface ArticlesSectionProps {
    articles: Article[];
    category: string;
}

export function ArticlesSection({ articles, category }: ArticlesSectionProps) {

    const createSnippet = (content: ArticleContentBlock[] | string, length = 150) => {
        if (!content) return '';

        let textToSnippet = '';

        if (Array.isArray(content)) {
            // Find the first paragraph and use its content for the snippet
            const firstParagraph = content.find(item => item.type === 'p');
            textToSnippet = firstParagraph ? firstParagraph.content : '';
        } else {
            // Fallback for old string format
            textToSnippet = content;
        }

        if (textToSnippet.length <= length) return textToSnippet;
        return textToSnippet.substring(0, length) + '...';
    }

    if (!articles || articles.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>No articles are available for the "{category}" category at the moment.</p>
                <p className="text-sm mt-2">Content is generated automatically. Please check back later.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {articles.map((article, index) => {
                // The slug for the category should be a clean, URL-friendly string.
                const categorySlug = article.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                const articleUrl = `/${categorySlug}/${article.slug}`;

                return (
                    <Card key={index} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                        <CardHeader className="p-0">
                            <Link href={articleUrl}>
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
                                <Link href={articleUrl} className={'hover:underline'}>
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
                              className={'flex items-center text-sm font-semibold text-foreground hover:underline'}
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
