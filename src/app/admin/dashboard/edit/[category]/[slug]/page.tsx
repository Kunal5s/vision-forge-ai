
import { notFound } from 'next/navigation';
import { getArticleForEdit } from '@/lib/articles';
import EditArticleForm from '@/components/vision-forge/EditArticleForm';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// This is now a Server Component
export default async function EditArticlePage({ params }: { params: { category: string; slug: string } }) {
    
    // Fetching data on the server
    const article = await getArticleForEdit(params.category as string, params.slug as string);

    if (!article) {
        notFound();
    }
    
    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
           {/* The Client Component is rendered here, receiving the server-fetched data as props */}
           <Suspense fallback={
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
           }>
                <EditArticleForm article={article} categorySlug={params.category as string} />
           </Suspense>
        </main>
    );
}
