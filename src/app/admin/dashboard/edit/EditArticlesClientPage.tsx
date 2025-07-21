
'use client';

import type { Article } from '@/lib/articles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, FileText, Folder, Search, CheckCircle, Edit3 } from 'lucide-react';
import Image from 'next/image';
import { categorySlugMap } from '@/lib/constants';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import parse from 'html-react-parser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EditArticlesClientPageProps {
    publishedArticlesByCategory: { category: string, articles: Article[] }[];
    draftArticles: Article[];
}

export default function EditArticlesClientPage({ publishedArticlesByCategory, draftArticles }: EditArticlesClientPageProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const getSnippet = (content: Article['articleContent']) => {
        const pBlock = content.find(c => c.type === 'p')?.content || '';
        const strippedContent = pBlock.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
        return strippedContent.substring(0, 150);
    };

    const filterArticles = (articles: Article[]) => {
        if (!searchTerm) return articles;
        const lowercasedFilter = searchTerm.toLowerCase();
        return articles.filter(article =>
            article.title.toLowerCase().replace(/<[^>]*>?/gm, '').includes(lowercasedFilter) ||
            getSnippet(article.articleContent).toLowerCase().includes(lowercasedFilter)
        );
    };

    const filteredPublished = useMemo(() => {
        return publishedArticlesByCategory
            .map(categoryData => ({
                ...categoryData,
                articles: filterArticles(categoryData.articles),
            }))
            .filter(categoryData => categoryData.articles.length > 0);
    }, [searchTerm, publishedArticlesByCategory]);
    
    const filteredDrafts = useMemo(() => filterArticles(draftArticles), [searchTerm, draftArticles]);


    const renderArticleList = (articles: Article[], isDraft: boolean) => (
        <div className="space-y-4">
            {articles.map(article => {
                const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === article.category) || article.category.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                const editUrl = isDraft 
                    ? `/admin/dashboard/edit/drafts/${article.slug}` 
                    : `/admin/dashboard/edit/${categorySlug}/${article.slug}`;
                return (
                    <div key={article.slug} className="flex items-start md:items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors flex-wrap md:flex-nowrap">
                        <Image
                            src={article.image}
                            alt={article.title.replace(/<[^>]*>?/gm, '')}
                            width={80}
                            height={80}
                            className="rounded-md object-cover aspect-square shrink-0"
                            data-ai-hint={article.dataAiHint}
                        />
                        <div className="flex-grow min-w-0">
                            <h3 className="font-semibold text-lg text-foreground truncate" title={article.title.replace(/<[^>]*>?/gm, '')}>{parse(article.title)}</h3>
                            <div className="flex items-center gap-2 mt-1 mb-2 flex-wrap">
                                <Badge variant={isDraft ? 'secondary' : 'default'} className={cn(isDraft ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700', 'text-white')}>
                                    {isDraft ? <Edit3 className="mr-1.5 h-3.5 w-3.5" /> : <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                                    {isDraft ? 'Draft' : 'Published'}
                                </Badge>
                                 <Badge variant="outline">{article.category}</Badge>
                                <p className="text-xs text-muted-foreground truncate">
                                    /{isDraft ? 'drafts' : categorySlug}/{article.slug}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 hidden md:block">
                                {getSnippet(article.articleContent)}...
                            </p>
                        </div>
                        <Button asChild variant="secondary" size="sm" className="shrink-0 ml-auto">
                            <Link href={editUrl}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                );
            })}
        </div>
    );

    const renderEmptyState = (isDraftTab: boolean) => (
         <div className="text-center py-10 text-muted-foreground">
            <FileText size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No Articles Found</h3>
            <p>{searchTerm ? `No ${isDraftTab ? 'drafts' : 'articles'} found matching your search.` : `It looks like there are no ${isDraftTab ? 'drafts' : 'articles'} yet.`}</p>
            {!searchTerm && (
                <Button asChild className="mt-4">
                    <Link href="/admin/dashboard/create">Create New Article</Link>
                </Button>
            )}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">Manage All Articles</CardTitle>
                <CardDescription>
                    Here you can find all published articles and drafts. Use the search bar to filter by title or content.
                </CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        className="pl-10 w-full md:w-1/2 lg:w-1/3"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="published" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="published">Published</TabsTrigger>
                        <TabsTrigger value="drafts">Drafts ({draftArticles.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="published">
                        {filteredPublished.length > 0 ? (
                             <div className="space-y-8 mt-6">
                                {filteredPublished.map(({ category, articles }) => (
                                    <section key={category}>
                                        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4 border-b pb-2">
                                            <Folder className="h-6 w-6 text-primary" />
                                            Category: {category}
                                        </h2>
                                        {renderArticleList(articles, false)}
                                    </section>
                                ))}
                            </div>
                        ) : renderEmptyState(false)}
                    </TabsContent>
                    <TabsContent value="drafts">
                        {filteredDrafts.length > 0 ? (
                            <div className="space-y-4 mt-6">
                                {renderArticleList(filteredDrafts, true)}
                            </div>
                        ) : renderEmptyState(true)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
