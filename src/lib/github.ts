
'use server';

import { Octokit } from 'octokit';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

// This check now correctly uses the variable names from the .env file.
if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME || !GITHUB_TOKEN) {
  console.warn('GitHub environment variables (GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_TOKEN) are not fully set. Article persistence will be disabled.');
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Function to get file content and sha
export async function getContent(path: string): Promise<{ content: string; sha: string } | null> {
  if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME || !GITHUB_TOKEN) return null;
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: path,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (Array.isArray(response.data) || !('content' in response.data)) {
      return null;
    }

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    return { content, sha: response.data.sha };
  } catch (error: any) {
    if (error.status === 404) {
      return null; // File doesn't exist
    }
    console.error(`Error fetching content from GitHub for path: ${path}`, error);
    throw error;
  }
}

// Function to save content to the repo
export async function saveContent(path: string, content: string, message: string, sha?: string) {
  if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME || !GITHUB_TOKEN) return;
  try {
    const encodedContent = Buffer.from(content).toString('base64');
    
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: path,
      message: message,
      content: encodedContent,
      sha: sha, // Include sha if updating an existing file
       headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    console.log(`Successfully saved content to ${path}`);
  } catch (error) {
    console.error(`Error saving content to GitHub for path: ${path}`, error);
    throw error;
  }
}
