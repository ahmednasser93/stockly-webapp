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
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

