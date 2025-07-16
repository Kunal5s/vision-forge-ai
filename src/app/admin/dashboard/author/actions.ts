
'use server';

import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { AuthorSchema, type AuthorData } from '@/lib/author';
import { Octokit } from 'octokit';
import { getPrimaryBranch, getShaForFile } from '../create/actions'; // Reuse helper functions

const authorFilePath = path.join(process.cwd(), 'src/lib/author.json');
const authorRepoPath = 'src/lib/author.json'; // Path in the repository

// Action to get the current author data
export async function getAuthorData(): Promise<AuthorData> {
    try {
        // For reading, local file is fine as it's part of the build
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
        const errorDetails = validatedFields.error.flatten().fieldErrors;
        return { success: false, error: JSON.stringify(errorDetails) };
    }

    const fileContent = JSON.stringify(validatedFields.data, null, 2);

    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.error("GitHub credentials are not configured on the server. Cannot save author data.");
        return { success: false, error: "GitHub credentials not configured. Please check server environment variables." };
    }

    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, authorRepoPath, branch);
        
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: authorRepoPath,
            message: 'feat: 🧑‍💻 Update author information',
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: branch,
        });
        
        console.log(`Successfully committed author data changes to GitHub on branch "${branch}".`);
        
        // Revalidate paths that use author data
        revalidatePath('/author/kunal-sonpitre');
        revalidatePath('/[category]/[slug]');

        return { success: true };

    } catch (error: any) {
        console.error('Failed to save author data to GitHub:', error);
        return { success: false, error: `Failed to write data to the server: ${error.message}` };
    }
}
