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

  // Add timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url.toString(), {
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

    // Fetch 1-hour historical data from FMP for the last 7 days
    // This provides better granularity for the 1W chart
    try {
      const now = new Date();
      const fromDate = new Date();
      fromDate.setDate(now.getDate() - 7);

      const toStr = now.toISOString().split('T')[0];
      const fromStr = fromDate.toISOString().split('T')[0];

      const fmpUrl = new URL(`https://financialmodelingprep.com/stable/historical-chart/30min/${symbol.toUpperCase()}`);
      fmpUrl.searchParams.set('apikey', 'z5xjUUlsab7zBKntL5QnMzWyPuq2iWsM');
      fmpUrl.searchParams.set('from', fromStr);
      fmpUrl.searchParams.set('to', toStr);

      const fmpResponse = await fetch(fmpUrl.toString());
      if (fmpResponse.ok) {
        const fmpData = await fmpResponse.json();
        if (Array.isArray(fmpData)) {
          // Transform FMP data to ChartDataPoint format
          interface FMPHistoricalItem {
            date: string;
            close?: number;
            open?: number;
            volume?: number;
          }
          const chartPoints = fmpData.map((item: FMPHistoricalItem) => ({
            date: item.date,
            price: item.close ?? item.open ?? 0, // Use close or open price
            volume: item.volume
          })).reverse(); // FMP returns newest first, we want oldest first

          // Update the 1W chart data
          if (data.chart) {
            data.chart['1W'] = chartPoints;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch FMP historical data:', error);
      // Continue with original data if FMP fetch fails
    }

    return data as StockDetails;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout: The server took too long to respond");
    }
    throw error;
  }
}

