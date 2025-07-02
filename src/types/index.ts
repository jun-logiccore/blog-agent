export interface BlogPost {
  title: string;
  content: string;
  coverImageUrl: string;
  tags: string[];
  category: string;
  date: string;
  inlineImages?: InlineImage[];
}

export interface InlineImage {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
}

export interface BlogIdea {
  title: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface PexelsPhoto {
  id: number;
  src: {
    large: string;
    medium: string;
  };
  photographer: string;
  photographer_url: string;
  url: string;
  alt: string;
}

export interface PexelsSearchResult {
  photos: PexelsPhoto[];
}

export interface BlogMetadata {
  tags: string[];
  category: string;
}
