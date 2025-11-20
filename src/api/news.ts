import type { NewsResponse, NewsPaginationOptions } from "../types/news";

// Use same API base URL as client.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://stockly-api.ahmednasser1993.workers.dev");

/**
 * Build URL with pagination parameters
 */
function buildNewsUrl(
  url: URL,
  pagination?: NewsPaginationOptions
): void {
  if (pagination?.from) {
    url.searchParams.set("from", pagination.from);
  }
  if (pagination?.to) {
    url.searchParams.set("to", pagination.to);
  }
  if (pagination?.page !== undefined) {
    url.searchParams.set("page", pagination.page.toString());
  }
  if (pagination?.limit !== undefined) {
    // Ensure limit is within valid range (1-250)
    const limit = Math.max(1, Math.min(250, pagination.limit));
    url.searchParams.set("limit", limit.toString());
  }
}

/**
 * Fetch stock news for a single symbol
 */
export async function fetchStockNews(
  symbol: string,
  pagination?: NewsPaginationOptions
): Promise<NewsResponse> {
  const url = new URL(`${API_BASE_URL}/v1/api/get-news`);
  url.searchParams.set("symbol", symbol.toUpperCase());
  buildNewsUrl(url, pagination);

  const response = await fetch(url.toString(), {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch news: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as NewsResponse;
}

/**
 * Fetch stock news for multiple symbols (max 10)
 */
export async function fetchMultipleStockNews(
  symbols: string[],
  pagination?: NewsPaginationOptions
): Promise<NewsResponse> {
  if (symbols.length === 0) {
    return {
      symbols: [],
      news: [],
      pagination: {
        page: 0,
        limit: 20,
        total: 0,
        hasMore: false,
      },
      cached: false,
    };
  }

  if (symbols.length > 10) {
    throw new Error("Maximum 10 symbols allowed");
  }

  const url = new URL(`${API_BASE_URL}/v1/api/get-news`);
  const symbolsParam = symbols.map((s) => s.toUpperCase()).join(",");
  url.searchParams.set("symbols", symbolsParam);
  buildNewsUrl(url, pagination);

  const response = await fetch(url.toString(), {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch news: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as NewsResponse;
}

