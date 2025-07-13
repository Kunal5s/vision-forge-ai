import { getArticles, type Article } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import EditArticlesClientPage from './EditArticlesClientPage';

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
            
            <EditArticlesClientPage allArticlesByCategory={allArticlesByCategory} />

        </main>
    );
}
