
export type AspectRatio = '9:16' | '16:9';

export interface Scene {
  id: number;
  shotType: string;
  description: string;
  location: string;
  mood: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage: boolean;
  videoUrl?: string;
  isGeneratingVideo: boolean;
  videoGenerationProgress?: string;
  error?: string;
}

export interface SceneDescription {
  shotType: string;
  description: string;
  location: string;
  mood: string;
  imagePrompt: string;
}
