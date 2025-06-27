
export interface GeneratedImageParams {
  prompt: string;
  aspectRatio: string;
}

export interface GeneratedImageHistoryItem extends GeneratedImageParams {
  id: string;
  imageUrl: string; // Only storing one image URL to prevent storage quota errors.
  timestamp: Date;
}

// New types for subscription
export type Plan = 'free' | 'pro' | 'mega';

export interface Credits {
  google: number;
  pollinations: number;
}

export interface Subscription {
  email: string;
  plan: Plan;
  status: 'active' | 'inactive';
  credits: Credits; // Changed from number to Credits object
  expires?: string;
  lastReset: string; // ISO string to track daily credit reset for free plan
}
