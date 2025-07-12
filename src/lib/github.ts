
'use server';

import 'dotenv/config';
import { Octokit } from 'octokit';
import fs from 'fs/promises';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

// Check if all required GitHub variables are present
const canCommitToGithub = GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME;

let octokit: Octokit | null = null;
if (canCommitToGithub) {
  octokit = new Octokit({ auth: GITHUB_TOKEN });
}

// Function to get the SHA of a file if it exists
async function getFileSha(filePath: string): Promise<string | undefined> {
  if (!octokit) return undefined;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO_OWNER!,
      repo: GITHUB_REPO_NAME!,
      path: filePath,
    });
    // The response for a file is an object, for a directory it's an array.
    if (!Array.isArray(data) && data.sha) {
        return data.sha;
    }
    return undefined;
  } catch (error: any) {
    if (error.status === 404) {
      return undefined; // File doesn't exist
    }
    console.error(`Error getting SHA for ${filePath}:`, error);
    throw error;
  }
}

// Function to commit and push files to GitHub
export async function commitAndPushToGithub(directoryPath: string, commitMessage: string) {
  if (!canCommitToGithub || !octokit) {
    console.warn("GitHub credentials not configured. Skipping commit to GitHub.");
    return;
  }
  console.log("Starting GitHub commit process...");

  try {
    const files = await fs.readdir(directoryPath);
    if(files.length === 0) {
        console.log("No files to commit in the specified directory.");
        return;
    }

    for (const file of files) {
        const localFilePath = path.join(directoryPath, file);
        const repoFilePath = `src/articles/${file}`; // Path in the repository
        
        const content = await fs.readFile(localFilePath, 'utf-8');
        const contentEncoded = Buffer.from(content).toString('base64');
        const sha = await getFileSha(repoFilePath);
        
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER!,
            repo: GITHUB_REPO_NAME!,
            path: repoFilePath,
            message: commitMessage,
            content: contentEncoded,
            sha: sha, // Undefined if file is new
        });
        console.log(`  - Committed file: ${repoFilePath}`);
    }

    console.log("✔ All generated article files have been successfully committed to GitHub.");
  } catch (error) {
    console.error("✖ A critical error occurred during the GitHub commit process:", error);
  }
}
