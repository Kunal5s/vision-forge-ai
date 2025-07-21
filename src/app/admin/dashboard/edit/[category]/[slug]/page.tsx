
import { notFound } from 'next/navigation';
import { getArticleForEdit } from '@/lib/articles';
import EditArticleForm from './EditArticleForm';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// This is now a Server Component that fetches data and passes it to the client form
export default async function EditArticlePage({ params }: { params: { category: string; slug: string } }) {
    
    // Fetch data on the server
    const article = await getArticleForEdit(params.category as string, params.slug as string);

    if (!article) {
        notFound();
    }
    
    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
           <Suspense fallback={
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
           }>
                {/* Pass the fetched data as a prop to the Client Component */}
                <EditArticleForm article={article} categorySlug={params.category as string} />
           </Suspense>
        </main>
    );
}
