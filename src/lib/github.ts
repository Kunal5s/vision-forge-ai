
'use server';

import { Octokit } from 'octokit';
import fs from 'fs/promises';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

const useGitHub = !!GITHUB_TOKEN && !!GITHUB_REPO_OWNER && !!GITHUB_REPO_NAME;

let octokit: Octokit | null = null;
if (useGitHub) {
  octokit = new Octokit({ auth: GITHUB_TOKEN });
} else {
  console.warn('GitHub environment variables are not fully set. Using local filesystem for article persistence.');
}

// Function to get file content and sha
export async function getContent(filePath: string): Promise<{ content: string; sha: string } | null> {
  if (!useGitHub || !octokit) {
      // Fallback to local filesystem if GitHub is not configured
      const localPath = path.join(process.cwd(), filePath);
      try {
          const content = await fs.readFile(localPath, 'utf-8');
          // There's no 'sha' for local files, but we don't need it for this logic.
          return { content, sha: '' };
      } catch (error: any) {
          if (error.code === 'ENOENT') {
              return null; // File doesn't exist locally
          }
          throw error;
      }
  }

  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: GITHUB_REPO_OWNER!,
      repo: GITHUB_REPO_NAME!,
      path: filePath,
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
      return null; // File doesn't exist on GitHub
    }
    console.error(`Error fetching content from GitHub for path: ${filePath}`, error);
    throw error;
  }
}

// Function to save content
export async function saveContent(filePath: string, content: string, message: string, sha?: string) {
    const localPath = path.join(process.cwd(), filePath);
    const localDir = path.dirname(localPath);

    try {
        await fs.mkdir(localDir, { recursive: true });
        await fs.writeFile(localPath, content, 'utf-8');
        console.log(`Successfully saved content locally to ${filePath}`);
    } catch (error) {
        console.error(`Error saving content locally to ${filePath}:`, error);
        throw error;
    }

    if (!useGitHub || !octokit) {
        return; // Skip GitHub operation if not configured
    }

    try {
        const encodedContent = Buffer.from(content).toString('base64');
        
        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          owner: GITHUB_REPO_OWNER!,
          repo: GITHUB_REPO_NAME!,
          path: filePath,
          message: message,
          content: encodedContent,
          sha: sha, // Include sha if updating an existing file
           headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        console.log(`Successfully synced content to GitHub for ${filePath}`);
    } catch (error) {
        console.error(`Error saving content to GitHub for path: ${filePath}`, error);
        // Don't throw here, as local save might have succeeded.
    }
}
