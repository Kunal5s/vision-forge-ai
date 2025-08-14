

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
  publishedDate: z.string().optional(), 
  summary: z.string().optional(),
  articleContent: z.array(ArticleContentBlockSchema),
  // Adding these flexible fields for custom article structures
  keyTakeaways: z.array(z.string()).optional(),
  conclusion: z.string().optional(),
});
export type Article = z.infer<typeof ArticleSchema>;


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
