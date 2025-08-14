import { z } from 'zod';

export const ArticleContentBlockSchema = z.object({
  type: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'ul', 'ol', 'blockquote', 'table']),
  content: z.string(),
  alt: z.string().optional(),
});
export type ArticleContentBlock = z.infer<typeof ArticleContentBlockSchema>;

export const ArticleSchema = z.object({
  image: z.string().url(),
  dataAiHint: z.string(),
  category: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(['published', 'draft']).default('published'),
  publishedDate: z.string().datetime().optional(),
  summary: z.string().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
});
export type Article = z.infer<typeof ArticleSchema>;


// Schema for the manual editor form
export const ManualArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  slug: z.string().min(5, 'Slug must be at least 5 characters long.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes.'),
  category: z.string().min(1, 'Please select a category.'),
  status: z.enum(['published', 'draft']),
  summary: z.string().optional(),
  content: z.string().min(50, 'Content must be at least 50 characters long.'),
  image: z.string().url('A valid image URL is required.'),
  originalSlug: z.string().optional(), // For identifying article on edit
  originalStatus: z.enum(['published', 'draft']).optional(),
});
export type ManualArticleFormData = z.infer<typeof ManualArticleSchema>;

// Helper function to convert the structured content array back to a single HTML string for the editor
export const articleContentToHtml = (content: Article['articleContent']): string => {
    if (!content) return '';
    return content.map(block => {
        if (block.type === 'img') {
            return `<div class="my-8"><img src="${block.content}" alt="${block.alt || ''}" class="rounded-lg shadow-md mx-auto" /></div>`;
        }
        if(block.type === 'ul' || block.type === 'ol' || block.type === 'blockquote' || block.type === 'table') {
            return block.content;
        }
        return `<${block.type}>${block.content}</${block.type}>`;
    }).join(''); 
};

// Helper function to generate a full article HTML string for previews
export const getFullArticleHtmlForPreview = (data: Partial<ManualArticleFormData>): string => {
  return `${data.summary || ''}${data.content || ''}`;
};



// Subscription types
export type Plan = 'free' | 'pro' | 'mega';

export interface Credits {
  google: number;
}

// Zod schema for validation
export const SubscriptionSchema = z.object({
  email: z.string(),
  plan: z.enum(['free', 'pro', 'mega']),
  status: z.enum(['active', 'inactive']),
  credits: z.object({
    google: z.number().nonnegative(),
  }),
  purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date string",
  }),
  lastReset: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date string",
  }),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;