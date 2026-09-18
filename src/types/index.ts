export type PromptCategory = 'image' | 'code' | 'writing' | 'reasoning' | 'general';

export interface PromptWeakness {
  id: string;
  title: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface EnhancedOption {
  id: 'quick' | 'expert' | 'engine';
  title: string;
  tag: string;
  description: string;
  prompt: string;
  whyItWorks: string;
  parameters?: Record<string, string>;
}

export interface PromptAnalysisResult {
  originalPrompt: string;
  category: PromptCategory;
  categoryLabel: string;
  qualityScore: number; // 0 - 100
  summaryDiagnosis: string;
  weaknesses: PromptWeakness[];
  strengths: string[];
  options: {
    quick: EnhancedOption;
    expert: EnhancedOption;
    engine: EnhancedOption;
  };
}

export interface AppSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  floatingBadgeEnabled: boolean;
  preferredLanguage: 'ko' | 'en' | 'auto';
  defaultImageEngine: 'midjourney' | 'flux' | 'dalle' | 'sdxl';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalPrompt: string;
  category: PromptCategory;
  qualityScore: number;
  enhancedPrompt: string;
  enhancedMode: 'quick' | 'expert' | 'engine';
  isFavorite?: boolean;
}
