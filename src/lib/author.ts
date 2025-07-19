
import { z } from 'zod';

// Define the schema for the author data
export const AuthorSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    title: z.string().min(1, 'Title is required.'),
    photoUrl: z.string().url('A valid photo URL is required.'),
    bio: z.string().min(10, 'Bio must be at least 10 characters long.'),
});

export type AuthorData = z.infer<typeof AuthorSchema>;
