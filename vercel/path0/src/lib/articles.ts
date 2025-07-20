
'use server';

import { z } from 'zod';
import { categorySlugMap } from './constants';
import { ArticleSchema, type Article, ManualArticleSchema, type ArticleContentBlock } from './types';
import { Octokit } from 'octokit';
import { JSDOM } from 'jsdom';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Direct imports to ensure files are bundled during the build process.
import featuredArticles from '@/articles/featured.json';
import inspirationArticles from '@/articles/inspiration.json';
import nftArticles from '@/articles/nft.json';
import promptsArticles from '@/articles/prompts.json';
import storybookArticles from '@/articles/storybook.json';
import stylesArticles from '@/articles/styles.json';
import technologyArticles from '@/articles/technology.json';
import trendsArticles from '@/articles/trends.json';
import tutorialsArticles from '@/articles/tutorials.json';
import usecasesArticles from '@/articles/usecases.json';
// Import drafts if the file exists, otherwise use an empty array.
import draftArticles from '@/articles/drafts.json';

export type { Article, ArticleContentBlock } from './types';

// This function is NOT exported, so it is not a Server Action.
// It's a private utility for use within this file only.
function htmlToArticleContent(html: string): ArticleContentBlock[] {
    if (!html) {
        return [];
    }

    const dom = new JSDOM(`<body>${html}</body>`);
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

const ArticleFileSchema = z.array(ArticleSchema);

// A map to hold all imported article data, connecting slug to the imported JSON.
const allCategoryData: { [key: string]: any } = {
    'featured': featuredArticles,
    'inspiration': inspirationArticles,
    'nft': nftArticles,
    'prompts': promptsArticles,
    'storybook': storybookArticles,
    'styles': stylesArticles,
    'technology': technologyArticles,
    'trends': trendsArticles,
    'tutorials': tutorialsArticles,
    'usecases': usecasesArticles,
    'drafts': draftArticles,
};


async function loadAndValidateArticles(category: string): Promise<z.infer<typeof ArticleSchema>[]> {
    // For drafts, the category IS the slug. Otherwise, find slug from map.
    const categorySlug = category === 'drafts' ? 'drafts' : Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category);
    
    if (!categorySlug) {
        console.error(`No slug found for category "${category}"`);
        return [];
    }

    const articlesData = allCategoryData[categorySlug];

    if (!articlesData) {
        // This is normal for the drafts file if it doesn't exist yet
        if (category === 'drafts') return [];
        console.error(`No article data found for category slug "${categorySlug}"`);
        return [];
    }
    
    try {
        const validatedArticles = ArticleFileSchema.safeParse(articlesData);

        if (validatedArticles.success) {
            return validatedArticles.data.map(article => ({
                ...article,
                publishedDate: article.publishedDate || new Date().toISOString()
            }));
        } else {
            console.error(`Zod validation failed for category "${category}".`, validatedArticles.error.flatten());
            return [];
        }

    } catch (error: any) {
        console.error(`Error validating articles for category "${category}":`, error.message);
        return [];
    }
}

// For public-facing pages: gets ONLY published articles.
export async function getArticles(category: string): Promise<z.infer<typeof ArticleSchema>[]> {
    const allArticles = await loadAndValidateArticles(category);
    return allArticles.filter(article => article.status === 'published');
}

// For admin pages: gets ALL articles from a specific category, including drafts within that file.
export async function getAllArticlesAdmin(category: string): Promise<z.infer<typeof ArticleSchema>[]> {
    return await loadAndValidateArticles(category);
}

// For editing page: get a single article, checking drafts first
export async function getArticleForEdit(category: string, slug: string): Promise<Article | undefined> {
    // 1. Check drafts first
    const drafts = await getAllArticlesAdmin('drafts');
    const draft = drafts.find(a => a.slug === slug);
    if (draft) return draft;

    // 2. If not in drafts, check the published category
    const articles = await getAllArticlesAdmin(category);
    return articles.find(a => a.slug === slug);
}


// Reusable GitHub helper functions
export async function getShaForFile(octokit: Octokit, owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        if (Array.isArray(data) || !('sha' in data)) {
            return undefined;
        }
        return data.sha;
    } catch (error: any) {
        if (error.status === 404) {
            return undefined; // File doesn't exist, so no SHA
        }
        throw error;
    }
}

export async function getPrimaryBranch(octokit: Octokit, owner: string, repo: string): Promise<string> {
    if (process.env.GITHUB_BRANCH) {
        return process.env.GITHUB_BRANCH;
    }
    try {
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        return repoData.default_branch;
    } catch (error) {
         console.error("Could not determine primary branch.", error);
         throw new Error("Could not determine primary branch for the repository.");
    }
}

// Universal function to save updated articles to a specific category file on GitHub
export async function saveUpdatedArticles(
    category: string, 
    articles: Article[], 
    commitMessage: string
) {
    const categorySlug = category === 'drafts' ? 'drafts' : Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category);
    if (!categorySlug) {
        throw new Error(`Invalid category name provided: ${category}`);
    }
    
    // Use 'drafts' for the filename if category is drafts, otherwise use the slug.
    const finalFileName = `${categorySlug}.json`;
    const repoPath = `src/articles/${finalFileName}`;
    
    const fileContent = JSON.stringify(articles, null, 2);

    const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        console.error("GitHub credentials are not configured on the server. Cannot save articles.");
        throw new Error("GitHub credentials not configured. Please check server environment variables.");
    }

    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const branch = await getPrimaryBranch(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME);
        const fileSha = await getShaForFile(octokit, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, repoPath, branch);

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            path: repoPath,
            message: commitMessage,
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileSha,
            branch: branch,
        });

        console.log(`Successfully committed changes for "${finalFileName}" to GitHub on branch "${branch}".`);

    } catch (error: any) {
        console.error(`Failed to commit changes to GitHub for file ${finalFileName}`, error);
        throw new Error("Failed to save to GitHub. Please check your credentials and repository permissions.");
    }
}


// Server action for auto-saving a draft to the `drafts` folder on GitHub
export async function autoSaveArticleDraft(draftData: Article): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate draft data before saving
        const validatedDraft = ArticleSchema.safeParse({ ...draftData, status: 'draft' });
        if (!validatedDraft.success) {
            return { success: false, error: 'Invalid draft data provided for auto-saving.' };
        }
        
        const allDrafts = await getAllArticlesAdmin('drafts');
        const draftIndex = allDrafts.findIndex(d => d.slug === validatedDraft.data.slug);

        if (draftIndex > -1) {
            allDrafts[draftIndex] = validatedDraft.data;
        } else {
            allDrafts.unshift(validatedDraft.data);
        }
        
        // Save the entire drafts.json file
        await saveUpdatedArticles('drafts', allDrafts, `docs: 📝 Autosave draft for "${validatedDraft.data.title}"`);

        revalidatePath('/admin/dashboard/edit');
        return { success: true };

    } catch (error: any) {
        console.error('Failed to auto-save draft to GitHub:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteArticleAction(category: string, slug: string, isDraft: boolean = true) {
    try {
        const categorySlug = isDraft ? 'drafts' : (Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category);
        const articles = await getAllArticlesAdmin(categorySlug);
        const updatedArticles = articles.filter(a => a.slug !== slug);

        if (articles.length === updatedArticles.length) {
            console.warn(`Article to delete (${slug}) was not found in ${categorySlug}.json`);
            return { success: true, message: "Not found, no action taken." };
        }

        await saveUpdatedArticles(categorySlug, updatedArticles, `feat: 🗑️ Delete article "${slug}"`);
        
        revalidatePath(`/`);
        revalidatePath(`/${categorySlug}`);
        revalidatePath(`/${categorySlug}/${slug}`);
        revalidatePath('/admin/dashboard/edit');

    } catch (e: any) {
        return { success: false, error: e.message };
    }
    
    // Redirect must happen outside the try/catch
    if(!isDraft) {
        redirect('/admin/dashboard/edit');
    }
    return { success: true };
}


export async function editArticleAction(data: unknown) {
  const validatedFields = ManualArticleSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid data." };
  }
  const { title, slug, summary, content, keyTakeaways, conclusion, originalSlug, category, status, image } = validatedFields.data;

  try {
    const isOriginallyDraft = (await getAllArticlesAdmin('drafts')).some(d => d.slug === originalSlug);
    const originalCategory = isOriginallyDraft ? 'drafts' : category;

    const allArticles = await getAllArticlesAdmin(originalCategory);
    const articleIndex = allArticles.findIndex(a => a.slug === originalSlug);

    if (articleIndex === -1 && !isOriginallyDraft) {
      throw new Error("Article to edit was not found.");
    }
    
    const newArticleContent = htmlToArticleContent(content);

    const updatedArticleData: Article = {
      title,
      slug,
      category,
      status,
      image,
      dataAiHint: "manual content update",
      publishedDate: (articleIndex > -1 && allArticles[articleIndex].publishedDate) || new Date().toISOString(),
      summary: summary || '',
      articleContent: newArticleContent.length > 0 ? newArticleContent : (articleIndex > -1 ? allArticles[articleIndex].articleContent : []),
      keyTakeaways: (keyTakeaways || []).map(k => k.value).filter(v => v && v.trim() !== ''),
      conclusion: conclusion,
    };
    
    const finalValidatedArticle = ArticleSchema.safeParse(updatedArticleData);
    if (!finalValidatedArticle.success) {
      console.error("Final validation failed after edit processing:", finalValidatedArticle.error.flatten());
      return { success: false, error: "Failed to process edited article data correctly." };
    }
    
    // Handle moving between draft/published status
    if (status === 'published') {
        const publishedArticles = await getAllArticlesAdmin(category);
        const existingPublishedIndex = publishedArticles.findIndex(a => a.slug === originalSlug);

        if (existingPublishedIndex > -1) {
            publishedArticles[existingPublishedIndex] = finalValidatedArticle.data;
        } else {
            publishedArticles.unshift(finalValidatedArticle.data);
        }
        await saveUpdatedArticles(category, publishedArticles, `feat: ✏️ Publish article "${title}"`);
        
        if (isOriginallyDraft) {
            const drafts = await getAllArticlesAdmin('drafts');
            const updatedDrafts = drafts.filter(d => d.slug !== originalSlug);
            await saveUpdatedArticles('drafts', updatedDrafts, `refactor: 🧹 Remove published draft "${originalSlug}"`);
        }
    } else { // Saving as draft
        const drafts = await getAllArticlesAdmin('drafts');
        const draftIndex = drafts.findIndex(d => d.slug === originalSlug);
        if (draftIndex > -1) {
            drafts[draftIndex] = finalValidatedArticle.data;
        } else {
            drafts.unshift(finalValidatedArticle.data);
        }
        await saveUpdatedArticles('drafts', drafts, `docs: 📝 Update draft "${title}"`);

        // If it was originally published, remove it from the published category
        if (!isOriginallyDraft) {
            const publishedArticles = await getAllArticlesAdmin(category);
            const updatedPublished = publishedArticles.filter(p => p.slug !== originalSlug);
            await saveUpdatedArticles(category, updatedPublished, `refactor: ♻️ Unpublish article "${originalSlug}" to drafts`);
        }
    }

    revalidatePath(`/`);
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/admin/dashboard/edit');

  } catch (e: any) {
    return { success: false, error: e.message };
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
        const allDrafts = await getAllArticlesAdmin('drafts');
        const updatedDrafts = [finalValidatedArticle.data, ...allDrafts];
        await saveUpdatedArticles('drafts', updatedDrafts, `docs: 📝 Save manual draft "${newArticleData.title}"`);
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
