import { useQuery } from "@tanstack/react-query";
import { fetchStockNews, fetchMultipleStockNews } from "../api/news";
import type { NewsResponse, NewsPaginationOptions } from "../types/news";
import { useSettings } from "../state/SettingsContext";

/**
 * Hook to fetch news for a single stock symbol
 */
export function useStockNews(
  symbol: string,
  pagination?: NewsPaginationOptions
) {
  const { cacheStaleTimeMinutes, cacheGcTimeMinutes } = useSettings();
  
  // Build query key that includes pagination params
  const queryKey = [
    "stockNews",
    symbol.toUpperCase(),
    pagination?.from || "",
    pagination?.to || "",
    pagination?.page ?? 0,
    pagination?.limit ?? 20,
  ];

  return useQuery<NewsResponse, Error>({
    queryKey,
    queryFn: () => fetchStockNews(symbol, pagination),
    enabled: !!symbol,
    staleTime: cacheStaleTimeMinutes * 60 * 1000,
    gcTime: cacheGcTimeMinutes * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch news for multiple stock symbols (max 10)
 */
export function useMultipleStockNews(
  symbols: string[],
  pagination?: NewsPaginationOptions
) {
  const { cacheStaleTimeMinutes, cacheGcTimeMinutes } = useSettings();
  
  const normalizedSymbols = symbols
    .map((s) => s.toUpperCase())
    .filter((s) => s.length > 0)
    .slice(0, 10); // Limit to 10 symbols

  // Build query key that includes pagination params
  const queryKey = [
    "stockNews",
    "multiple",
    normalizedSymbols.sort().join(","),
    pagination?.from || "",
    pagination?.to || "",
    pagination?.page ?? 0,
    pagination?.limit ?? 20,
  ];

  return useQuery<NewsResponse, Error>({
    queryKey,
    queryFn: () => fetchMultipleStockNews(normalizedSymbols, pagination),
    enabled: normalizedSymbols.length > 0,
    staleTime: cacheStaleTimeMinutes * 60 * 1000,
    gcTime: cacheGcTimeMinutes * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
  });
}

