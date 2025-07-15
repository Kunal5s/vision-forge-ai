
import { getArticles, type Article } from '@/lib/articles';
import { notFound } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import EditArticleForm from './EditArticleForm';

// This page now uses the same form component as the create page, ensuring consistency.

// Function to find the article
async function getArticleData(categorySlug: string, articleSlug: string): Promise<{ article: Article, categoryName: string } | undefined> {
    const categoryName = Object.entries(categorySlugMap).find(([slug]) => slug === categorySlug)?.[1];
    if (!categoryName) return undefined;
    
    const articles = await getArticles(categoryName);
    const article = articles.find(article => article.slug === articleSlug);

    if (!article) return undefined;

    return { article, categoryName };
}

export default async function EditArticlePage({ params }: { params: { category: string; slug: string } }) {
    const data = await getArticleData(params.category, params.slug);

    if (!data) {
        notFound();
    }

    const { article, categoryName } = data;

    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
           <EditArticleForm article={article} categoryName={categoryName} />
        </main>
    );
}
