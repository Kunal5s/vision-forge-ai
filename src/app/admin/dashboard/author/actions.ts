
'use server';

import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { AuthorSchema, type AuthorData } from '@/lib/author';

const authorFilePath = path.join(process.cwd(), 'src/lib/author.json');

// Action to get the current author data
export async function getAuthorData(): Promise<AuthorData> {
    try {
        const fileContents = await fs.readFile(authorFilePath, 'utf-8');
        const data = JSON.parse(fileContents);
        return AuthorSchema.parse(data);
    } catch (error) {
        // If the file doesn't exist or is invalid, return default data
        console.warn("Could not read author.json, returning default data.", error);
        return {
            name: 'Kunal Sonpitre',
            title: 'AI & Business Technical Expert',
            photoUrl: 'https://placehold.co/100x100.png',
            bio: 'Kunal is an expert in leveraging artificial intelligence to solve complex business challenges. His work focuses on making advanced technology accessible and practical for creators and businesses alike.',
        };
    }
}

// Action to save the updated author data
export async function saveAuthorData(data: unknown): Promise<{ success: boolean; error?: string }> {
    const validatedFields = AuthorSchema.safeParse(data);

    if (!validatedFields.success) {
        return { success: false, error: validatedFields.error.flatten().fieldErrors.toString() };
    }

    try {
        const jsonString = JSON.stringify(validatedFields.data, null, 2);
        await fs.writeFile(authorFilePath, jsonString, 'utf-8');
        
        // Revalidate paths that use author data
        revalidatePath('/author/kunal-sonpitre');
        revalidatePath('/[category]/[slug]');

        return { success: true };
    } catch (error) {
        console.error('Failed to save author data:', error);
        return { success: false, error: 'Failed to write data to the server.' };
    }
}
