
'use server';

import { z } from 'zod';
import { JSDOM } from 'jsdom';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Octokit } from 'octokit';

import { categorySlugMap } from './constants';
import {
  ArticleSchema,
  type Article,
  ManualArticleSchema,
  type ArticleContentBlock,
} from './types';
import {
  getAllArticlesAdmin,
  getPrimaryBranch,
  getShaForFile,
  getArticleForEdit,
} from './articles';

// This function uses JSDOM and must only be used on the server.
// It is NOT exported, so it's a private utility for this module.
function htmlToArticleContent(html: string): ArticleContentBlock[] {
  if (!html) {
    return [];
  }

  const dom = new JSDOM(`<body>${html}</body>`);
  const document = dom.window.document;
  const content: ArticleContentBlock[] = [];

  document.body.childNodes.forEach((node) => {
    if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      // Use the outerHTML to preserve the element itself (e.g., <h2>...</h2>)
      const tagName =
        element.tagName.toLowerCase() as ArticleContentBlock['type'];

      if (
        [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'ul',
          'ol',
          'blockquote',
          'table',
        ].includes(tagName)
      ) {
        const outerHTML = element.outerHTML.trim();
        if (outerHTML) {
          content.push({ type: tagName, content: outerHTML, alt: '' });
        }
      } else if (tagName === 'div' && element.querySelector('img')) {
        // Handle images wrapped in divs which is common from RTEs
        const img = element.querySelector('img');
        if (img && img.hasAttribute('src')) {
          content.push({
            type: 'img',
            content: img.getAttribute('src')!,
            alt: img.getAttribute('alt') || '',
          });
        }
      } else if (tagName === 'img' && element.hasAttribute('src')) {
        content.push({
          type: 'img',
          content: element.getAttribute('src')!,
          alt: element.getAttribute('alt') || '',
        });
      }
    }
  });
  return content.filter(
    (block) => (block.content && block.content.trim() !== '') || block.type === 'img'
  );
}

// Universal function to save updated articles to a specific category file on GitHub
export async function saveUpdatedArticles(
  category: string,
  articles: Article[],
  commitMessage: string,
  fileName?: string // optional specific filename for drafts
) {
  const categorySlug =
    category === 'drafts'
      ? 'drafts'
      : Object.keys(categorySlugMap).find(
          (key) => categorySlugMap[key] === category
        );
  if (!categorySlug) {
    throw new Error(`Invalid category name provided: ${category}`);
  }

  // Use specific filename for drafts, otherwise use category slug.
  const finalFileName = fileName || `${categorySlug}.json`;
  const repoPath =
    category === 'drafts' && fileName
      ? `src/articles/drafts/${finalFileName}`
      : `src/articles/${finalFileName}`;

  const fileContent = JSON.stringify(articles, null, 2);

  const { GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
    console.error(
      'GitHub credentials are not configured on the server. Cannot save articles.'
    );
    throw new Error(
      'GitHub credentials not configured. Please check server environment variables.'
    );
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const branch = await getPrimaryBranch(
      octokit,
      GITHUB_REPO_OWNER,
      GITHUB_REPO_NAME
    );
    const fileSha = await getShaForFile(
      octokit,
      GITHUB_REPO_OWNER,
      GITHUB_REPO_NAME,
      repoPath,
      branch
    );

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      path: repoPath,
      message: commitMessage,
      content: Buffer.from(fileContent).toString('base64'),
      sha: fileSha,
      branch: branch,
    });

    console.log(
      `Successfully committed changes for "${finalFileName}" to GitHub on branch "${branch}".`
    );
  } catch (error: any) {
    console.error(
      `Failed to commit changes to GitHub for file ${finalFileName}`,
      error
    );
    throw new Error(
      'Failed to save to GitHub. Please check your credentials and repository permissions.'
    );
  }
}

export async function addImagesToArticleAction(
  content: string,
  imageCount: number = 5
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const dom = new JSDOM(`<body>${content}</body>`);
    const document = dom.window.document;

    // Select all potential insertion points (headings and long paragraphs)
    const insertionPoints = Array.from(document.querySelectorAll('h2, h3, p'));

    // Remove any previously added AI images to avoid duplicates
    document.querySelectorAll('img[src*="pollinations.ai"]').forEach((img) => {
      const parent = img.parentElement;
      if (
        parent &&
        parent.tagName.toLowerCase() === 'div' &&
        parent.classList.contains('my-8')
      ) {
        parent.remove();
      } else {
        img.remove();
      }
    });

    // Filter for points that have enough text content to be a meaningful prompt
    const validInsertionPoints = insertionPoints.filter(
      (h) => h.textContent && h.textContent.trim().split(' ').length > 5
    );

    const numImagesToAdd = Math.min(imageCount, validInsertionPoints.length);
    if (numImagesToAdd === 0) {
      return {
        success: false,
        error:
          'No suitable locations found to add images. Try adding more subheadings or longer paragraphs.',
      };
    }

    // Distribute images evenly throughout the content
    const step = Math.max(
      1,
      Math.floor(validInsertionPoints.length / numImagesToAdd)
    );

    for (let i = 0; i < numImagesToAdd; i++) {
      const pointIndex = Math.min(i * step, validInsertionPoints.length - 1);
      const insertionPoint = validInsertionPoints[pointIndex];
      // Use the heading/paragraph text as a prompt for the image
      const topic = insertionPoint.textContent?.trim() || 'relevant photography';

      if (topic) {
        const seed = Math.floor(Math.random() * 1_000_000);
        const finalPrompt = `${topic.substring(
          0,
          100
        )}, relevant photography, high detail, cinematic`;
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          finalPrompt
        )}?width=800&height=450&seed=${seed}&nologo=true`;

        const imgContainer = document.createElement('div');
        imgContainer.className = 'my-8'; // Consistent styling
        const img = document.createElement('img');
        img.src = pollinationsUrl;
        img.alt = topic;
        img.setAttribute('width', '800');
        img.setAttribute('height', '450');
        img.className = 'rounded-lg shadow-lg mx-auto';

        imgContainer.appendChild(img);

        // Insert the new image container after the insertion point
        insertionPoint.parentNode?.insertBefore(
          imgContainer,
          insertionPoint.nextSibling
        );
      }
    }

    return { success: true, content: document.body.innerHTML };
  } catch (e: any) {
    console.error('Failed to add images to article content on server:', e);
    return {
      success: false,
      error: 'Could not process article content to add images.',
    };
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
export async function createManualArticleAction(
  data: unknown
): Promise<CreateArticleResult> {
  const validatedFields = ManualArticleSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten());
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const formattedError = Object.entries(errorMessages)
      .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
      .join('; ');
    return { success: false, error: formattedError || 'Invalid input data.' };
  }

  const {
    title,
    slug,
    category,
    status,
    summary,
    content,
    keyTakeaways,
    conclusion,
    image,
  } = validatedFields.data;

  try {
    const articleContent = htmlToArticleContent(content);

    const newArticleData: Article = {
      title,
      slug,
      category,
      status,
      image,
      dataAiHint: 'manual content upload',
      publishedDate: new Date().toISOString(),
      summary: summary || '',
      articleContent,
      keyTakeaways: keyTakeaways
        ? keyTakeaways.map((k) => k.value).filter((v) => v && v.trim() !== '')
        : [],
      conclusion: conclusion || '',
    };

    const finalValidatedArticle = ArticleSchema.safeParse(newArticleData);

    if (!finalValidatedArticle.success) {
      console.error(
        'Final Validation Failed after processing:',
        finalValidatedArticle.error.flatten()
      );
      return {
        success: false,
        error: 'Failed to process article data correctly.',
      };
    }

    // Save as draft or publish directly
    if (status === 'published') {
      const existingArticles = await getAllArticlesAdmin(category);
      const updatedArticles = [finalValidatedArticle.data, ...existingArticles];
      await saveUpdatedArticles(
        category,
        updatedArticles,
        `feat: ✨ Add new manual article "${newArticleData.title}"`
      );
    } else {
      // Save to drafts folder
      const allDrafts = await getAllArticlesAdmin('drafts');
      const updatedDrafts = [finalValidatedArticle.data, ...allDrafts];
      await saveUpdatedArticles(
        'drafts',
        updatedDrafts,
        `docs: 📝 Save manual draft "${newArticleData.title}"`,
        'drafts.json'
      );
    }

    revalidatePath('/');
    const categorySlug =
      Object.keys(categorySlugMap).find(
        (key) => categorySlugMap[key] === category
      ) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${newArticleData.slug}`);
    revalidatePath('/admin/dashboard/edit');

    // Redirect to the edit page after creation
    return {
      success: true,
      title: newArticleData.title,
      slug,
      category: categorySlug,
    };
  } catch (error) {
    console.error('Error in createManualArticleAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

// Action to save a draft to the dedicated autosave-drafts branch/folder
export async function autoSaveManualDraftAction(
  draftData: Article
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate draft data before saving
    const validatedDraft = ArticleSchema.safeParse({
      ...draftData,
      status: 'draft',
    });
    if (!validatedDraft.success) {
      return {
        success: false,
        error: 'Invalid draft data provided for auto-saving.',
      };
    }

    const allDrafts = await getAllArticlesAdmin('drafts');
    const draftIndex = allDrafts.findIndex(
      (d) => d.slug === validatedDraft.data.slug
    );

    if (draftIndex > -1) {
      allDrafts[draftIndex] = validatedDraft.data;
    } else {
      allDrafts.unshift(validatedDraft.data);
    }

    // Save the entire drafts.json file
    await saveUpdatedArticles(
      'drafts',
      allDrafts,
      `docs: 📝 Autosave draft for "${validatedDraft.data.title}"`,
      'drafts.json'
    );

    revalidatePath('/admin/dashboard/edit');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to auto-save draft to GitHub:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteArticleAction(
  category: string,
  slug: string,
  isDraft: boolean = true
) {
  try {
    const categoryName = isDraft ? 'drafts' : category;
    let articles = await getAllArticlesAdmin(categoryName);
    const updatedArticles = articles.filter((a) => a.slug !== slug);

    if (articles.length === updatedArticles.length) {
      console.warn(`Article to delete (${slug}) was not found in ${categoryName}.json`);
      // If it's not found in drafts, check published categories too
      if(isDraft) {
         for (const catName of Object.values(categorySlugMap)) {
            let publishedArticles = await getAllArticlesAdmin(catName);
            const originalLength = publishedArticles.length;
            const updatedPublished = publishedArticles.filter(a => a.slug !== slug);
            if(updatedPublished.length < originalLength) {
                await saveUpdatedArticles(catName, updatedPublished, `feat: 🗑️ Delete article "${slug}"`);
            }
         }
      } else {
        return { success: true, message: "Not found, no action taken." };
      }
    } else {
        await saveUpdatedArticles(
            categoryName,
            updatedArticles,
            `feat: 🗑️ Delete article "${slug}"`
        );
    }
    
    const categorySlug = Object.keys(categorySlugMap).find(key => categorySlugMap[key] === category) || category.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    revalidatePath(`/`);
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/admin/dashboard/edit');
  } catch (e: any) {
    return { success: false, error: e.message };
  }

  // Redirect must happen outside the try/catch
  redirect('/admin/dashboard/edit');
}

export async function editArticleAction(data: unknown) {
  const validatedFields = ManualArticleSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: 'Invalid data.' };
  }
  const {
    title,
    slug,
    summary,
    content,
    keyTakeaways,
    conclusion,
    originalSlug,
    category,
    status,
    image,
  } = validatedFields.data;

  try {
    const isOriginallyDraft = (await getAllArticlesAdmin('drafts')).some(
      (d) => d.slug === originalSlug
    );
    const originalCategory = isOriginallyDraft ? 'drafts' : category;

    const allArticles = await getAllArticlesAdmin(originalCategory);
    let existingArticle = allArticles.find((a) => a.slug === originalSlug);

    // If not found in original category (e.g., category was changed), search all.
    if (!existingArticle) {
        for (const catName of Object.values(categorySlugMap)) {
            const articles = await getAllArticlesAdmin(catName);
            existingArticle = articles.find(a => a.slug === originalSlug);
            if (existingArticle) break;
        }
    }
    
    if (!existingArticle) {
      throw new Error('Article to edit was not found.');
    }

    const newArticleContent = htmlToArticleContent(content);

    const updatedArticleData: Article = {
      ...existingArticle,
      title,
      slug,
      summary: summary || '',
      status,
      image,
      articleContent:
        newArticleContent.length > 0
          ? newArticleContent
          : existingArticle.articleContent,
      keyTakeaways: (keyTakeaways || [])
        .map((k) => k.value)
        .filter((v) => v && v.trim() !== ''),
      conclusion: conclusion,
      publishedDate:
        status === 'published'
          ? existingArticle.publishedDate || new Date().toISOString()
          : new Date().toISOString(),
      category: category,
    };

    const finalValidatedArticle = ArticleSchema.safeParse(updatedArticleData);
    if (!finalValidatedArticle.success) {
      console.error(
        'Final validation failed after edit processing:',
        finalValidatedArticle.error.flatten()
      );
      return {
        success: false,
        error: 'Failed to process edited article data correctly.',
      };
    }

    // Handle file logic: add to new, remove from old
    if (status === 'published') {
        const publishedArticles = await getAllArticlesAdmin(category);
        const articleIndex = publishedArticles.findIndex(a => a.slug === slug || a.slug === originalSlug);
        if(articleIndex > -1) {
            publishedArticles[articleIndex] = finalValidatedArticle.data;
        } else {
            publishedArticles.unshift(finalValidatedArticle.data);
        }
        await saveUpdatedArticles(category, publishedArticles, `feat: ✏️ Publish/update article "${title}"`);
    } else { // Saving as draft
        const drafts = await getAllArticlesAdmin('drafts');
        const draftIndex = drafts.findIndex(d => d.slug === slug || d.slug === originalSlug);
        if(draftIndex > -1) {
            drafts[draftIndex] = finalValidatedArticle.data;
        } else {
            drafts.unshift(finalValidatedArticle.data);
        }
        await saveUpdatedArticles('drafts', drafts, `docs: 📝 Save draft "${title}"`);
    }

    // If status or category changed, remove from old location
    const categoryChanged = category !== existingArticle.category;
    const statusChanged = status !== existingArticle.status;
    
    if (statusChanged || categoryChanged) {
        const oldCategory = existingArticle.category;
        const oldStatusIsDraft = existingArticle.status === 'draft';
        const oldFileCategory = oldStatusIsDraft ? 'drafts' : oldCategory;
        
        const oldArticles = await getAllArticlesAdmin(oldFileCategory);
        const updatedOldArticles = oldArticles.filter(a => a.slug !== originalSlug);
        await saveUpdatedArticles(oldFileCategory, updatedOldArticles, `refactor: 🧹 Move article "${slug}" from ${oldFileCategory}`);
    }


    revalidatePath(`/`);
    const categorySlug =
      Object.keys(categorySlugMap).find(
        (key) => categorySlugMap[key] === category
      ) || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    revalidatePath(`/${categorySlug}`);
    revalidatePath(`/${categorySlug}/${slug}`);
    revalidatePath('/admin/dashboard/edit');
  } catch (e: any) {
    return { success: false, error: e.message };
  }
  redirect('/admin/dashboard/edit');
}
