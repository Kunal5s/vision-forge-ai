
'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import EditStoryForm from '@/components/vision-forge/EditStoryForm';

// This is the main page component
export default function EditStoryPage({ params }: { params: { slug: string } }) {
    
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
