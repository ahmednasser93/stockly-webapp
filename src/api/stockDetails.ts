import type { StockDetails } from "../types/stockDetails";

// Use same API base URL as client.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://stockly-api.ahmednasser1993.workers.dev");

export async function fetchStockDetails(symbol: string): Promise<StockDetails> {
  const url = new URL(`${API_BASE_URL}/v1/api/get-stock-details`);
  url.searchParams.set("symbol", symbol.toUpperCase());

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch stock details: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as StockDetails;
}

