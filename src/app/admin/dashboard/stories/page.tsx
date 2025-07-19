

import { getAllStoriesAdmin } from '@/lib/stories';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BookImage, PlusCircle } from 'lucide-react';
import { ManageStoriesClientPage } from './ManageStoriesClientPage';
import type { Story } from '@/lib/stories';

async function getAllStoriesGrouped(): Promise<{ category: string, stories: Story[] }[]> {
    // Currently, all stories are in the 'featured' category.
    // This function can be expanded if more categories are added.
    const stories = await getAllStoriesAdmin('featured');
    if (stories.length === 0) {
        return [];
    }
    return [{ category: 'All Stories', stories }];
}


export default async function ManageStoriesPage() {
    const storiesByCategory = await getAllStoriesGrouped();

    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <BookImage className="h-8 w-8" /> Manage Web Stories
                    </h1>
                     <p className="text-muted-foreground mt-1">
                        Here you can edit, update, or delete your existing web stories.
                    </p>
                </div>
                 <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <Button asChild>
                         <Link href="/admin/dashboard/stories/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Story
                        </Link>
                    </Button>
                </div>
            </div>
            
            <ManageStoriesClientPage allStoriesByCategory={storiesByCategory} />

        </main>
    );
}
