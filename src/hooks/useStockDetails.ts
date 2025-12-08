import { useQuery } from "@tanstack/react-query";
import { fetchStockDetails } from "../api/stockDetails";
import type { StockDetails } from "../types/stockDetails";
import { useSettings } from "../state/SettingsContext";

export function useStockDetails(symbol: string) {
  const { cacheStaleTimeMinutes, cacheGcTimeMinutes } = useSettings();
  
  return useQuery<StockDetails, Error>({
    queryKey: ["stockDetails", symbol.toUpperCase()],
    queryFn: () => fetchStockDetails(symbol.toUpperCase()),
    enabled: !!symbol,
    staleTime: cacheStaleTimeMinutes * 60 * 1000,
    gcTime: cacheGcTimeMinutes * 60 * 1000,
    retry: 2, // Reduced from 3 to 2 for faster failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s instead of 30s
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Use cached data if available
  });
}

