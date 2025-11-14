import type { SearchResult, StockQuote } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "https://stockly-api.ahmednasser1993.workers.dev";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  const url = `${API_BASE_URL}/v1/api/search-stock?query=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url);
  const data = await handleResponse<SearchResult[]>(res);
  return data ?? [];
}

export async function fetchStocks(symbols: string[]): Promise<StockQuote[]> {
  if (!symbols.length) return [];
  const params = symbols.join(",");
  const url = `${API_BASE_URL}/v1/api/get-stocks?symbols=${encodeURIComponent(
    params
  )}`;
  const res = await fetch(url);
  return handleResponse<StockQuote[]>(res);
}
