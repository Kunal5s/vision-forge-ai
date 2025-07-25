
import { AuthorBio } from '@/components/vision-forge/AuthorBio';
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getAllArticlesAdmin } from '@/lib/articles';
import type { Metadata } from 'next';
import { categorySlugMap } from '@/lib/constants';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';
import { getAuthorData } from '@/app/admin/dashboard/author/actions';
import { type AuthorData } from '@/lib/author';

export async function generateMetadata(): Promise<Metadata> {
    const author: AuthorData = await getAuthorData();
    return {
        title: `About the Author: ${author.name} | Imagen BrainAi`,
        description: `Learn more about ${author.name}, the ${author.title.toLowerCase()} behind the content on Imagen BrainAi.`,
    };
}


export const dynamic = 'force-dynamic';

async function AllAuthorArticles() {
    // Fetch all articles from all categories
    const allCategoryNames = Object.values(categorySlugMap);
    const promises = allCategoryNames.map(category => getAllArticlesAdmin(category));
    const articlesByCategory = await Promise.all(promises);
    
    // Filter for published articles and flatten the array
    let allArticles = articlesByCategory.flat().filter(a => a.status === 'published');

    // Sort all articles by published date, most recent first
    allArticles.sort((a, b) => {
        if (a.publishedDate && b.publishedDate) {
            return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        }
        return a.title.localeCompare(b.title);
    });

    return <ArticlesSection articles={allArticles} category="All Articles" />;
}

export default async function AuthorPage() {
    const author = await getAuthorData();
    return (
        <main className="container mx-auto py-12 px-4">
            <header className="mb-12">
                <AuthorBio author={author} />
            </header>
            
            <section>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">
                    Articles by {author.name}
                </h2>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <AllAuthorArticles />
                </Suspense>
            </section>
        </main>
    );
}
