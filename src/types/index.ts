import { z } from 'zod';

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

// The main type is inferred from the schema
export type Subscription = z.infer<typeof SubscriptionSchema>;
