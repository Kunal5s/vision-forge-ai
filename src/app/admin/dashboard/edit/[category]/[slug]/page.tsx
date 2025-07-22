
'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import EditArticleForm from '@/components/vision-forge/EditArticleForm';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getArticleForEdit, type Article } from '@/lib/articles';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

function EditArticleLoader({ category, slug }: { category: string, slug: string }) {
    const [article, setArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        const fetchArticle = async () => {
            setIsLoading(true);
            const data = await getArticleForEdit(category, slug);
            if (data) {
                setArticle(data);
            } else {
                toast({ title: 'Error', description: 'Article not found.', variant: 'destructive' });
            }
            setIsLoading(false);
        };
        fetchArticle();
    }, [category, slug, toast]);

    if(isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        )
    }

    if (!article) {
        return <p className="text-center text-muted-foreground">Article could not be loaded.</p>
    }

    return <EditArticleForm article={article} categorySlug={category} />;
}


// This is the main page component
export default function EditArticlePage({ params }: { params: { category: string; slug: string } }) {
    const { user } = useUser();
    const router = useRouter();

    if (user && user.primaryEmailAddress?.emailAddress !== "kunalsonpitre555@gmail.com") {
        router.push('/');
        return null;
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
                <EditArticleLoader category={params.category} slug={params.slug} />
           </Suspense>
        </main>
    );
}
