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


// Types for Image Generation Flow (kept simple as it's handled in the API route)
export const GenerateImageInputSchema = z.object({
  prompt: z.string(),
  count: z.number().optional(),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export const GenerateImageOutputSchema = z.object({
  images: z.array(z.string()),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;
