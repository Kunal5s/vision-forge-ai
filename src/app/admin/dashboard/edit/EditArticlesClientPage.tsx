
'use client';

import type { Article } from '@/lib/articles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, FileText, Folder } from 'lucide-react';
import Image from 'next/image';

interface EditArticlesClientPageProps {
    allArticlesByCategory: { category: string, articles: Article[] }[];
}

export default function EditArticlesClientPage({ allArticlesByCategory }: EditArticlesClientPageProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">Manage All Articles</CardTitle>
                <CardDescription>
                    Here you can find all articles published on the site, organized by category. Click 'Edit' to modify an article.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {allArticlesByCategory.length > 0 ? (
                    <div className="space-y-8">
                        {allArticlesByCategory.map(({ category, articles }) => {
                            const categorySlug = category.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                            return (
                            <section key={category}>
                                <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4 border-b pb-2">
                                    <Folder className="h-6 w-6 text-primary" />
                                    Category: {category}
                                </h2>
                                <div className="space-y-4">
                                    {articles.map(article => (
                                        <div key={article.slug} className="flex items-start gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                            <Image
                                              src={article.image}
                                              alt={article.title}
                                              width={80}
                                              height={80}
                                              className="rounded-md object-cover aspect-square"
                                              data-ai-hint={article.dataAiHint}
                                            />
                                            <div className="flex-grow">
                                                <h3 className="font-semibold text-lg text-foreground">{article.title}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {(article.articleContent.find(c => c.type === 'p')?.content || '').substring(0, 150)}...
                                                </p>
                                                 <p className="text-xs text-muted-foreground mt-1">
                                                    Slug: /{categorySlug}/{article.slug}
                                                </p>
                                            </div>
                                            <Button asChild variant="secondary" size="sm">
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
                        <p>It looks like there are no articles yet. Go ahead and create one!</p>
                        <Button asChild className="mt-4">
                            <Link href="/admin/dashboard/create">Create New Article</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
