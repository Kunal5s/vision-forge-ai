
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { AuthorSchema, type AuthorData } from '@/lib/author';
import { getFile, saveFile } from '@/lib/github';

const AUTHOR_FILE_PATH = 'src/lib/author.json';

// Action to get the current author data from GitHub
export async function getAuthorData(): Promise<AuthorData> {
    try {
        const fileContent = await getFile(AUTHOR_FILE_PATH);
        if (!fileContent) {
            throw new Error('Author file not found or is empty.');
        }
        const data = JSON.parse(fileContent);
        // Validate with Zod before returning
        return AuthorSchema.parse(data);
    } catch (error) {
        console.error("Failed to fetch or parse author data from GitHub:", error);
        // Return a default or empty state if fetching fails
        return {
            name: 'Enter Name',
            title: 'Enter Title',
            photoUrl: 'https://placehold.co/100x100.png',
            bio: 'Enter a bio of at least 50 characters.',
        };
    }
}

// Action to save the updated author data to GitHub
export async function saveAuthorData(data: unknown): Promise<{ success: boolean; error?: string }> {
    const validatedFields = AuthorSchema.safeParse(data);

    if (!validatedFields.success) {
        const errorDetails = validatedFields.error.flatten().fieldErrors;
        return { success: false, error: JSON.stringify(errorDetails) };
    }
    
    try {
        const fileContent = JSON.stringify(validatedFields.data, null, 2);
        await saveFile(
            AUTHOR_FILE_PATH, 
            fileContent, 
            `docs: update author profile for ${validatedFields.data.name}`
        );

        // Revalidate paths that use author data
        revalidatePath('/author/kunal-sonpitre'); // Or use a dynamic author slug
        revalidatePath('/[category]/[slug]', 'layout');
        revalidatePath('/admin/dashboard/author');
        revalidatePath('/'); // Revalidate home page as well

        return { success: true };

    } catch (error: any) {
        console.error("Failed to save author data to GitHub:", error);
        return { success: false, error: error.message || "An unknown error occurred while saving to GitHub." };
    }
}
