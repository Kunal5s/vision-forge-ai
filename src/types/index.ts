
export interface GeneratedImageParams {
  prompt: string;
  aspectRatio: string;
}

export interface GeneratedImageHistoryItem extends GeneratedImageParams {
  id: string;
  imageUrl: string; // Only storing one image URL to prevent storage quota errors.
  timestamp: Date;
}
