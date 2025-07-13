import { getArticles, type Article } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit, FileText, Folder } from 'lucide-react';
import Image from 'next/image';

// This function fetches all articles from all known categories.
async function getAllArticles(): Promise<{ category: string, articles: Article[] }[]> {
    const categories = Object.values(categorySlugMap);
    const allArticlesData = await Promise.all(
        categories.map(async (categoryName) => {
            const articles = await getArticles(categoryName);
            return { category: categoryName, articles };
        })
    );
    // Filter out categories that have no articles
    return allArticlesData.filter(data => data.articles.length > 0);
}

export default async function EditArticlesPage() {
    const allArticlesByCategory = await getAllArticles();

    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
            <div className="mb-8">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Manage All Articles</CardTitle>
                    <CardDescription>
                        Here you can find all articles published on the site, organized by category.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {allArticlesByCategory.length > 0 ? (
                        <div className="space-y-8">
                            {allArticlesByCategory.map(({ category, articles }) => (
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
                                                        Slug: /{category.toLowerCase().replace(/ /g, '-')}/{article.slug}
                                                    </p>
                                                </div>
                                                <Button variant="secondary" size="sm" disabled>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit (Soon)
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
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
        </main>
    );
}
