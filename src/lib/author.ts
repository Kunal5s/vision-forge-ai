import { z } from 'zod';

// Define the schema for the author data
export const AuthorSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    title: z.string().min(1, 'Title is required.'),
    photoUrl: z.string().refine(val => val.startsWith('data:image/') || z.string().url().safeParse(val).success, {
        message: 'A valid photo URL or Data URI is required.',
    }),
    bio: z.string().min(10, 'Bio must be at least 10 characters long.'),
});

export type AuthorData = z.infer<typeof AuthorSchema>;
