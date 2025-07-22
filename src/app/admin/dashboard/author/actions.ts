
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { AuthorSchema, type AuthorData } from '@/lib/author';

const defaultData: AuthorData = {
    name: 'Kunal Sonpitre',
    title: 'AI & Business Technical Expert',
    photoUrl: 'https://placehold.co/100x100.png',
    bio: 'Kunal is an expert in leveraging artificial intelligence to solve complex business challenges. His work focuses on making advanced technology accessible and practical for creators and businesses alike.',
};

// Action to get the current author data
// TODO: Replace with Xata fetch
export async function getAuthorData(): Promise<AuthorData> {
    console.warn("GitHub fetching is deprecated. Returning default author data.");
    return defaultData;
}

// Action to save the updated author data
// TODO: Replace with Xata update/insert
export async function saveAuthorData(data: unknown): Promise<{ success: boolean; error?: string }> {
    const validatedFields = AuthorSchema.safeParse(data);

    if (!validatedFields.success) {
        const errorDetails = validatedFields.error.flatten().fieldErrors;
        return { success: false, error: JSON.stringify(errorDetails) };
    }
    
    console.log("Simulating save to Xata:", validatedFields.data);

    // Revalidate paths that use author data
    revalidatePath('/author/kunal-sonpitre');
    revalidatePath('/[category]/[slug]');
    revalidatePath('/admin/dashboard/author');

    return { success: true };
}
