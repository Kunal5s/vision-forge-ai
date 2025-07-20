
import { getAllArticlesAdmin } from '@/lib/articles';
import { type Article } from '@/lib/types';
import { categorySlugMap } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditArticlesClientPage from './EditArticlesClientPage';

// This function fetches all articles from all known categories and drafts.
async function getAllContent(): Promise<{
    published: { category: string, articles: Article[] }[],
    drafts: Article[]
}> {
    const categories = Object.values(categorySlugMap);
    const publishedArticlesData = await Promise.all(
        categories.map(async (categoryName) => {
            const articles = await getAllArticlesAdmin(categoryName);
            return { category: categoryName, articles: articles.filter(a => a.status === 'published') };
        })
    );
    
    const draftArticles = await getAllArticlesAdmin('drafts');

    return {
        published: publishedArticlesData.filter(data => data.articles.length > 0),
        drafts: draftArticles,
    };
}

export default async function EditArticlesPage() {
    const { published, drafts } = await getAllContent();

    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
            <div className="mb-8">
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            
            <EditArticlesClientPage
                publishedArticlesByCategory={published}
                draftArticles={drafts}
            />

        </main>
    );
}
