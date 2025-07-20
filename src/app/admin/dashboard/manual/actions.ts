
'use server';

import { type Article, ArticleSchema as ArticleValidationSchema, type ArticleContentBlock, ManualArticleSchema } from '@/lib/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveUpdatedArticles, getAllArticlesAdmin } from '@/lib/articles'; // Import the universal save function
import { redirect } from 'next/navigation';
import { JSDOM } from 'jsdom';
import { categorySlugMap } from '@/lib/constants';
import { Octokit } from 'octokit';
import { getPrimaryBranch, getShaForFile } from '@/lib/articles';

// New function to reliably parse HTML into the structured content blocks.
// This function uses JSDOM and must only be used on the server.
export function htmlToArticleContent(html: string): ArticleContentBlock[] {
    if (!html) {
        return [];
    }

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const content: ArticleContentBlock[] = [];
    
    document.body.childNodes.forEach(node => {
        if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // Use the outerHTML to preserve the element itself (e.g., <h2>...</h2>)
            const tagName = element.tagName.toLowerCase() as ArticleContentBlock['type'];

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote', 'table'].includes(tagName)) {
                const outerHTML = element.outerHTML.trim();
                if (outerHTML) {
                    content.push({ type: tagName, content: outerHTML, alt:'' });
                }
            } else if (tagName === 'div' && element.querySelector('img')) {
                // Handle images wrapped in divs which is common from RTEs
                const img = element.querySelector('img');
                if (img && img.hasAttribute('src')) {
                    content.push({ type: 'img', content: img.getAttribute('src')!, alt: img.getAttribute('alt') || '' });
                }
            } else if (tagName === 'img' && element.hasAttribute('src')) {
                content.push({ type: 'img', content: element.getAttribute('src')!, alt: element.getAttribute('alt') || '' });
            }
        }
    });
    return content.filter(block => (block.content && block.content.trim() !== '') || block.type === 'img');
}


export async function addImagesToArticleAction(content: string, imageCount: number = 5): Promise<{success: boolean, content?: string, error?: string}> {
    try {
        const dom = new JSDOM(`<body>${content}</body>`);
        const document = dom.window.document;
        
        // Select all potential insertion points (headings and long paragraphs)
        const insertionPoints = Array.from(document.querySelectorAll('h2, h3, p'));

        // Remove any previously added AI images to avoid duplicates
        document.querySelectorAll('img[src*="pollinations.ai"]').forEach(img => {
            const parent = img.parentElement;
            if (parent && parent.tagName.toLowerCase() === 'div' && parent.classList.contains('my-8')) {
                parent.remove();
            } else {
                img.remove();
            }
        });
        
        // Filter for points that have enough text content to be a meaningful prompt
        const validInsertionPoints = insertionPoints.filter(h => h.textContent && h.textContent.trim().split(' ').length > 5);
        
        const numImagesToAdd = Math.min(imageCount, validInsertionPoints.length);
        if (numImagesToAdd === 0) {
            return { success: false, error: "No suitable locations found to add images. Try adding more subheadings or longer paragraphs." };
        }
        
        // Distribute images evenly throughout the content
        const step = Math.max(1, Math.floor(validInsertionPoints.length / numImagesToAdd));

        for (let i = 0; i < numImagesToAdd; i++) {
            const pointIndex = Math.min(i * step, validInsertionPoints.length - 1);
            const insertionPoint = validInsertionPoints[pointIndex];
            // Use the heading/paragraph text as a prompt for the image
            const topic = insertionPoint.textContent?.trim() || "relevant photography";

            if (topic) {
                const seed = Math.floor(Math.random() * 1_000_000);
                const finalPrompt = `${topic.substring(0, 100)}, relevant photography, high detail, cinematic`;
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=800&height=450&seed=${seed}&nologo=true`;

                const imgContainer = document.createElement('div');
                imgContainer.className = "my-8"; // Consistent styling
                const img = document.createElement('img');
                img.src = pollinationsUrl;
                img.alt = topic;
                img.setAttribute('width', '800');
                img.setAttribute('height', '450');
                img.className = 'rounded-lg shadow-lg mx-auto';
                
                imgContainer.appendChild(img);
                
                // Insert the new image container after the insertion point
                insertionPoint.parentNode?.insertBefore(imgContainer, insertionPoint.nextSibling);
            }
        }
        
        return { success: true, content: document.body.innerHTML };
    } catch (e: any) {
        console.error("Failed to add images to article content on server:", e);
        return { success: false, error: "Could not process article content to add images." };
    }
}

type CreateArticleResult = {
  success: boolean;
  title?: string;
  error?: string;
  slug?: string;
  category?: string;
};

// Main server action for manual creation
export async function createManualArticleAction(data: unknown): Promise<CreateArticleResult> {
  const validatedFields = ManualArticleSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten());
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const formattedError = Object.entries(errorMessages).map(([field, errors]) => `${field}: ${errors?.join(', ')}`).join('; ');
    return { success: false, error: formattedError || 'Invalid input data.' };
  }
  
  const { title, slug, category, status, summary, content, keyTakeaways, conclusion, image } = validatedFields.data;

  try {
    const articleContent = htmlToArticleContent(content);

    const newArticleData: Article = {
      title,
      slug,
      category,
      status,
      image,
      dataAiHint: "manual content upload",
      publishedDate: new Date().toISOString(),
      summary: summary || '',
      articleContent,
      keyTakeaways: keyTakeaways ? keyTakeaways.map(k => k.value).filter(v => v && v.trim() !== '') : [],
      conclusion: conclusion || '',
    };

    const finalValidatedArticle = ArticleSchema.safeParse(newArticleData);

    if (!finalValidatedArticle.success) {
      console.error("Final Validation Failed after processing:", finalValidatedArticle.error.flatten());
      return { success: false, error: "Failed to process article data correctly." };
    }
    
    // Save as draft or publish directly
    if (status === 'published') {
        const existingArticles = await getAllArticlesAdmin(category);
        const updatedArticles = [finalValidatedArticle.data, ...existingArticles];
        await saveUpdatedArticles(category, updatedArticles, `feat: ✨ Add new manual article "${newArticleData.title}"`);
    } else {
        // Save to drafts folder
        const existingDrafts = await getAllArticlesAdmin('drafts');
        await saveUpdatedArticles('drafts', [finalValidatedArticle.data, ...existingDrafts], `docs: 📝 Save manual draft "${newArticleData.title}"`);
    }

    revalidatePath('/');
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticleData.slug}`);
    revalidatePath('/admin/dashboard/edit');
    
    // Redirect to the edit page after creation
    return { success: true, title: newArticleData.title, slug, category: categorySlug };

  } catch (error) {
    console.error('Error in createManualArticleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

// Action to save a draft to the dedicated autosave-drafts branch/folder
export async function autoSaveManualDraftAction(draftData: Article): Promise<{ success: boolean; error?: string }> {
    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        return { success: false, error: "GitHub credentials not configured on the server." };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const primaryBranch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
    const draftBranch = 'autosave-drafts';
    
    // Ensure the branch exists, creating it from the primary branch if it doesn't
    try {
        await octokit.rest.repos.getBranch({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            branch: draftBranch,
        });
    } catch (error: any) {
        if (error.status === 404) {
            const { data: { object: { sha } } } = await octokit.rest.repos.getBranch({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                branch: primaryBranch,
            });
            await octokit.rest.git.createRef({
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                ref: `refs/heads/${draftBranch}`,
                sha,
            });
        } else {
            throw error;
        }
    }

    try {
        const validatedDraft = ArticleSchema.safeParse({ ...draftData, status: 'draft' });
        if (!validatedDraft.success) {
            return { success: false, error: 'Invalid draft data for auto-saving.' };
        }
        
        const repoPath = `src/articles/drafts/${validatedDraft.data.slug}.json`;
        const fileContent = JSON.stringify(validatedDraft.data, null, 2);
        
        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, draftBranch);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: `docs: 📝 Autosave draft for "${validatedDraft.data.title}"`,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: draftBranch,
        });
        
        return { success: true };

    } catch (error: any) {
        console.error('Failed to auto-save draft to GitHub:', error);
        return { success: false, error: error.message };
    }
}
