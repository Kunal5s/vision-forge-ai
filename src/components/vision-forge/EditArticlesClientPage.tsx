
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

interface EditArticlesClientPageProps {
    allArticlesByCategory: { category: string, articles: Article[] }[];
}

export default function EditArticlesClientPage({ allArticlesByCategory }: EditArticlesClientPageProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredArticles = useMemo(() => {
        if (!searchTerm) {
            return allArticlesByCategory;
        }
        
        const lowercasedFilter = searchTerm.toLowerCase();

        return allArticlesByCategory
            .map(categoryData => {
                // Snippet generation for search
                const getSnippet = (content: Article['articleContent']) => {
                    const pBlock = content.find(c => c.type === 'p')?.content || '';
                    const strippedContent = pBlock.replace(/<[^>]*>?/gm, '');
                    return strippedContent.substring(0, 150);
                };

                const filtered = categoryData.articles.filter(article =>
                    article.title.toLowerCase().replace(/<[^>]*>?/gm, '').includes(lowercasedFilter) ||
                    (article.status && article.status.toLowerCase().includes(lowercasedFilter)) ||
                    getSnippet(article.articleContent).toLowerCase().includes(lowercasedFilter)
                );
                return { ...categoryData, articles: filtered };
            })
            .filter(categoryData => categoryData.articles.length > 0);

    }, [searchTerm, allArticlesByCategory]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">Manage All Articles</CardTitle>
                <CardDescription>
                    Here you can find all published articles and drafts. Use the search bar to filter by title, content, or status.
                </CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search articles (e.g., 'AI' or 'draft')..."
                        className="pl-10 w-full md:w-1/2 lg:w-1/3"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {filteredArticles.length > 0 ? (
                    <div className="space-y-8">
                        {filteredArticles.map(({ category, articles }) => {
                            const categorySlug = Object.entries(categorySlugMap).find(([, name]) => name === category)?.[0] || category.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                            return (
                            <section key={category}>
                                <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4 border-b pb-2">
                                    <Folder className="h-6 w-6 text-primary" />
                                    Category: {category}
                                </h2>
                                <div className="space-y-4">
                                    {articles.map(article => (
                                        <div key={article.slug} className="p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors flex items-center gap-4">
                                            <Image
                                              src={article.image}
                                              alt={article.title.replace(/<[^>]*>?/gm, '')}
                                              width={64}
                                              height={64}
                                              className="rounded-md object-cover aspect-square shrink-0"
                                              data-ai-hint={article.dataAiHint}
                                            />
                                            <div className="flex-grow min-w-0">
                                                <h3 className="font-semibold text-lg text-foreground truncate">{parse(article.title)}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                     <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className={cn(article.status === 'published' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600', 'text-white')}>
                                                        {article.status === 'published' ? <CheckCircle className="mr-1 h-3.5 w-3.5" /> : <Edit3 className="mr-1 h-3.5 w-3.5" />}
                                                        {article.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button asChild variant="secondary" size="sm" className="shrink-0 ml-auto">
                                                <Link href={`/admin/dashboard/edit/${categorySlug}/${article.slug}`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )})}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <FileText size={48} className="mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">No Articles Found</h3>
                        <p>{searchTerm ? "No articles found matching your search." : "It looks like there are no articles yet."}</p>
                        {!searchTerm && (
                            <Button asChild className="mt-4">
                                <Link href="/admin/dashboard/create">Create New Article</Link>
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
