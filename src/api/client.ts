import type { SearchResult, StockQuote } from "../types";

// Use localhost in development, production URL in builds
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV
    ? "https://stockly-api.ahmednasser1993.workers.dev" // Default to prod for dev to avoid localhost issues
    : "https://stockly-api.ahmednasser1993.workers.dev");

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

// Helper to create fetch options with credentials
function fetchOptions(init?: RequestInit): RequestInit {
  return {
    ...init,
    credentials: "include", // Always include cookies for authentication
  };
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  const url = `${API_BASE_URL}/v1/api/search-stock?query=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, fetchOptions());
  const data = await handleResponse<SearchResult[]>(res);
  return data ?? [];
}

export async function fetchStocks(symbols: string[]): Promise<StockQuote[]> {
  if (!symbols.length) return [];
  const params = symbols.join(",");
  const url = `${API_BASE_URL}/v1/api/get-stocks?symbols=${encodeURIComponent(
    params
  )}`;
  const res = await fetch(url, fetchOptions());
  return handleResponse<StockQuote[]>(res);
}
