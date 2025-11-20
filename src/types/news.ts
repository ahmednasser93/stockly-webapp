export interface NewsItem {
  title: string;
  text: string;
  url: string;
  publishedDate: string; // ISO 8601 format
  image: string | null;
  site: string;
  type: string;
}

export interface NewsPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface NewsResponse {
  symbols: string[];
  news: NewsItem[];
  pagination: NewsPagination;
  cached: boolean;
  partial?: boolean;
  error?: string;
}

export interface NewsPaginationOptions {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number; // 0-based
  limit?: number; // 1-250
}

