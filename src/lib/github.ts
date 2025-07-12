
import 'dotenv/config';
import { Octokit } from 'octokit';
import path from 'path';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_REPO_OWNER;
const repo = process.env.GITHUB_REPO_NAME;

async function getSha(filePath: string): Promise<string | undefined> {
    if (!owner || !repo) return undefined;
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: filePath,
        });
        if (Array.isArray(data) || !('sha' in data)) {
            return undefined;
        }
        return data.sha;
    } catch (error: any) {
        if (error.status === 404) {
            return undefined; // File doesn't exist, so no SHA
        }
        console.error(`Error getting SHA for ${filePath}:`, error);
        throw error;
    }
}

export async function saveArticleToGithub(category: string, content: string): Promise<void> {
    if (!process.env.GITHUB_TOKEN || !owner || !repo) {
        console.warn('GitHub credentials not provided. Skipping save to GitHub.');
        return;
    }

    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = `src/articles/${categorySlug}.json`;
    const message = `feat: Regenerate articles for ${category}`;

    try {
        const sha = await getSha(filePath);
        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message,
            content: Buffer.from(content).toString('base64'),
            sha, // If sha is undefined, this creates a new file. If it's defined, it updates.
        });
        console.log(`Successfully saved ${filePath} to GitHub.`);
    } catch (error) {
        console.error(`Failed to save ${filePath} to GitHub:`, error);
    }
}

    