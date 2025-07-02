import { z } from 'zod';

// New types for subscription
export type Plan = 'free' | 'pro' | 'mega';

export interface Credits {
  google: number;
}

export interface Subscription {
  email: string;
  plan: Plan;
  status: 'active' | 'inactive';
  credits: Credits; // Changed from number to Credits object
  purchaseDate: string; // ISO string to track plan start date
  lastReset: string; // ISO string to track daily credit reset for free plan
}


// Types for Image Generation Flow
export const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
  count: z.number().min(1).max(4).default(1).describe('The number of images to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export const GenerateImageOutputSchema = z.object({
  images: z.array(z.string()).describe('An array of generated image data URIs.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;
