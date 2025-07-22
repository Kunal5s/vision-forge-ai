
'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import EditStoryForm from './EditStoryForm';

// This is the main page component
export default function EditStoryPage({ params }: { params: { slug: string } }) {
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
                </div>
           }>
                <EditStoryForm slug={params.slug} />
           </Suspense>
        </main>
    );
}
