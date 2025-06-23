
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

export interface Subscription {
  email: string;
  plan: Plan;
  status: 'active' | 'inactive';
  credits: number;
  expires?: string; 
}
