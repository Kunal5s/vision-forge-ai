
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

// Action to get the current author data by fetching it directly from GitHub
export async function getAuthorData(): Promise<AuthorData> {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    const defaultData: AuthorData = {
        name: 'Kunal Sonpitre',
        title: 'AI & Business Technical Expert',
        photoUrl: 'https://placehold.co/100x100.png',
        bio: 'Kunal is an expert in leveraging artificial intelligence to solve complex business challenges. His work focuses on making advanced technology accessible and practical for creators and businesses alike.',
    };

    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.warn("GitHub credentials are not configured on the server. Returning default author data.");
        return defaultData;
    }

    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        
        const { data } = await octokit.rest.repos.getContent({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: authorRepoPath,
            ref: branch,
        });

        if ('content' in data) {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
            const jsonData = JSON.parse(fileContent);
            return AuthorSchema.parse(jsonData);
        } else {
             throw new Error('author.json is not a file.');
        }

    } catch (error: any) {
        if (error.status === 404) {
             console.warn("author.json not found in the repository. Returning default data.");
        } else {
            console.error('Failed to fetch author data from GitHub:', error);
        }
        return defaultData;
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
        revalidatePath('/admin/dashboard/author');


        return { success: true };

    } catch (error: any) {
        console.error('Failed to save author data to GitHub:', error);
        return { success: false, error: `Failed to write data to the server: ${error.message}` };
    }
}
