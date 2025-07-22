
'use server';

import { Octokit } from 'octokit';
import 'server-only';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME || !process.env.GITHUB_TOKEN) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing GitHub environment variables for content management.');
  }
  console.warn('Missing GitHub environment variables. Content management will be disabled.');
}

// Function to get a file from the repository
export async function getFile(path: string): Promise<string | null> {
  if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) return null;
  try {
    const response = await octokit.rest.repos.getContent({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path,
    });
    // The content is base64 encoded, so we need to decode it.
    if ('content' in response.data) {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error: any) {
    if (error.status === 404) {
      // File doesn't exist, which is a valid case (e.g., first article in a category)
      return null;
    }
    console.error(`Failed to get file from GitHub: ${path}`, error);
    throw error;
  }
}

// Function to save (create or update) a file in the repository
export async function saveFile(path: string, content: string, message: string): Promise<void> {
  if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
    console.warn("GitHub environment variables not set. Skipping file save.");
    return;
  }
  
  try {
    // We need the SHA of the file if it exists to update it.
    let sha: string | undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path,
      });
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) throw error;
      // If it's a 404, it's a new file, and sha remains undefined.
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha, // This is undefined for new files, which is correct.
      committer: {
        name: 'Imagen BrainAi Bot',
        email: 'bot@imagenbrain.ai',
      },
      author: {
        name: 'Imagen BrainAi Bot',
        email: 'bot@imagenbrain.ai',
      }
    });
  } catch (error) {
    console.error(`Failed to save file to GitHub: ${path}`, error);
    throw error;
  }
}

// Function to delete a file from the repository
export async function deleteFile(path: string, message: string): Promise<void> {
  if (!GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) return;
  try {
    // To delete a file, we need its current SHA
    const { data } = await octokit.rest.repos.getContent({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        path,
    });

    if (!('sha' in data)) {
        throw new Error("Could not find SHA for file to be deleted.");
    }
    
    await octokit.rest.repos.deleteFile({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path,
      message,
      sha: data.sha,
       committer: {
        name: 'Imagen BrainAi Bot',
        email: 'bot@imagenbrain.ai',
      },
      author: {
        name: 'Imagen BrainAi Bot',
        email: 'bot@imagenbrain.ai',
      }
    });
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Attempted to delete a file that does not exist: ${path}`);
      return; // It's already gone, so we can consider this a success.
    }
    console.error(`Failed to delete file from GitHub: ${path}`, error);
    throw error;
  }
}
