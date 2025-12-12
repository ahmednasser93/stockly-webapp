import type { StockDetails } from "../types/stockDetails";

import { API_BASE_URL } from "./client";

export async function fetchStockDetails(symbol: string): Promise<StockDetails> {
  const url = new URL(`${API_BASE_URL}/v1/api/get-stock-details`);
  url.searchParams.set("symbol", symbol.toUpperCase());

  // Add timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url.toString(), {
      credentials: "include",
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    // Original direct FMP fetch removed to use backend proxy only
    // The StockDetailsPage component now handles specific intraday fetching via /api/historical-intraday


    return data as StockDetails;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout: The server took too long to respond");
    }
    throw error;
  }
}

