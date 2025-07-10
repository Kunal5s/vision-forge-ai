
'use server';

import { Octokit } from 'octokit';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;


if (!GITHUB_USER || !GITHUB_REPO || !GITHUB_TOKEN || !OPENROUTER_API_KEY || !GOOGLE_API_KEY) {
  console.warn('One or more environment variables (GitHub, OpenRouter, Google) are not fully set. Article persistence and generation might be disabled.');
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Function to get file content and sha
export async function getContent(path: string): Promise<{ content: string; sha: string } | null> {
  if (!GITHUB_USER || !GITHUB_REPO || !GITHUB_TOKEN) return null;
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: GITHUB_USER!,
      repo: GITHUB_REPO!,
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
  if (!GITHUB_USER || !GITHUB_REPO || !GITHUB_TOKEN) return;
  try {
    const encodedContent = Buffer.from(content).toString('base64');
    
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: GITHUB_USER!,
      repo: GITHUB_REPO!,
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
