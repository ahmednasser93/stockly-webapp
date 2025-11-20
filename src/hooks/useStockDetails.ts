import { useQuery } from "@tanstack/react-query";
import { fetchStockDetails } from "../api/stockDetails";
import type { StockDetails } from "../types/stockDetails";

export function useStockDetails(symbol: string) {
  return useQuery<StockDetails, Error>({
    queryKey: ["stockDetails", symbol.toUpperCase()],
    queryFn: () => fetchStockDetails(symbol.toUpperCase()),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2, // Reduced from 3 to 2 for faster failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s instead of 30s
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Use cached data if available
  });
}

