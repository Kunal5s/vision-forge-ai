import type { StyleType, MoodType, LightingType, ColorType } from '@/lib/constants';

export interface GeneratedImageParams {
  prompt: string;
  aspectRatio: string;
  style?: StyleType;
  mood?: MoodType;
  lighting?: LightingType;
  color?: ColorType;
}

export interface GeneratedImageHistoryItem extends GeneratedImageParams {
  id: string;
  imageUrl: string;
  timestamp: Date;
}
