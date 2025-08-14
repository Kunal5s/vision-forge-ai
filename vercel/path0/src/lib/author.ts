
'use server';
import { z } from 'zod';
import { getFile } from '@/lib/github';

// Define the schema for the author data
export const AuthorSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    title: z.string().min(1, 'Title is required.'),
    photoUrl: z.string().url('A valid photo URL is required.'),
    bio: z.string().min(10, 'Bio must be at least 10 characters long.'),
});

export type AuthorData = z.infer<typeof AuthorSchema>;


// Action to get the current author data from GitHub
export async function getAuthorData(): Promise<AuthorData> {
    try {
        const fileContent = await getFile('src/lib/author.json');
        if (!fileContent) {
            throw new Error('Author file not found or is empty.');
        }
        const data = JSON.parse(fileContent);
        return AuthorSchema.parse(data);
    } catch (error) {
        console.error("Failed to fetch or parse author data from GitHub:", error);
        return {
            name: 'Kunal Sonpitre',
            title: 'AI & Business Technical Expert',
            photoUrl: 'https://placehold.co/100x100.png',
            bio: 'Default bio: founder of Imagen Brain AI.',
        };
    }
}
