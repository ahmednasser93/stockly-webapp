import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStocks, searchSymbols } from "../api/client";
import { getFavoriteStocks, updateFavoriteStocks } from "../api/favoriteStocks";
import type { StockQuote } from "../types";
import { SearchBar } from "../components/SearchBar";
import { TrackedSymbols } from "../components/TrackedSymbols";
import { StockCard } from "../components/StockCard";
import { useSettings } from "../state/SettingsContext";
import { useAuth } from "../state/AuthContext";
import { AuroraBackground } from "../components/reactbits/AuroraBackground";
import { useGsapFadeIn } from "../hooks/useGsapFadeIn";
import { useGsapStaggerList } from "../hooks/useGsapStaggerList";
import { NeonStat } from "../components/reactbits/NeonStat";

const TRACKED_STORAGE_KEY = "stockly-webapp-tracked";

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  
  // Load favorite stocks from API if authenticated, otherwise from localStorage
  const favoriteStocksQuery = useQuery({
    queryKey: ["favoriteStocks"],
    queryFn: getFavoriteStocks,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize trackedSymbols from API (if authenticated) or localStorage (fallback)
  const [trackedSymbols, setTrackedSymbols] = useState<string[]>(() => {
    // If authenticated, we'll load from API via the query
    // For now, fallback to localStorage for backward compatibility
    try {
      const stored = localStorage.getItem(TRACKED_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Failed to parse tracked symbols", error);
      return [];
    }
  });

  // Update trackedSymbols when favorite stocks are loaded from API
  useEffect(() => {
    if (isAuthenticated && favoriteStocksQuery.data) {
      const symbols = favoriteStocksQuery.data.map((stock) => stock.symbol);
      setTrackedSymbols(symbols);
    }
  }, [isAuthenticated, favoriteStocksQuery.data]);

  // Mutation to save favorite stocks to API
  const saveFavoriteStocksMutation = useMutation({
    mutationFn: (symbols: string[]) => updateFavoriteStocks(symbols),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteStocks"] });
    },
  });

  const { refreshInterval } = useSettings();
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  useGsapFadeIn(heroRef);
  useGsapStaggerList(statsRef);

  // Save to API if authenticated, otherwise save to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      // Save to API (debounced to avoid too many requests)
      const timeoutId = setTimeout(() => {
        saveFavoriteStocksMutation.mutate(trackedSymbols);
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    } else {
      // Fallback to localStorage for non-authenticated users
      localStorage.setItem(TRACKED_STORAGE_KEY, JSON.stringify(trackedSymbols));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedSymbols, isAuthenticated]);

  const searchQuery = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchSymbols(query.trim()),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const stocksQuery = useQuery({
    queryKey: ["stocks", trackedSymbols],
    queryFn: () => fetchStocks(trackedSymbols),
    enabled: trackedSymbols.length > 0,
    refetchInterval: trackedSymbols.length
      ? refreshInterval * 1000
      : false,
    placeholderData: (previousData) => previousData,
  });

  const handleAddSymbol = () => {
    const symbol = query.trim().toUpperCase();
    if (!symbol) return;
    if (!trackedSymbols.includes(symbol)) {
      setTrackedSymbols((prev) => [...prev, symbol]);
    }
    setQuery("");
  };

  const handleSelectSuggestion = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    if (!trackedSymbols.includes(upperSymbol)) {
      setTrackedSymbols((prev) => [...prev, upperSymbol]);
    }
    setQuery("");
  };

  const handleRemoveSymbol = (symbol: string) => {
    setTrackedSymbols((prev) => prev.filter((item) => item !== symbol));
  };

  const noData =
    trackedSymbols.length > 0 &&
    stocksQuery.data &&
    stocksQuery.data.length === 0;

  const sortedQuotes = useMemo(() => {
    const data = stocksQuery.data ?? [];
    const order = new Map(trackedSymbols.map((symbol, idx) => [symbol, idx]));
    return [...data].sort((a: StockQuote, b: StockQuote) => {
      const indexA = order.get(a.symbol) ?? 0;
      const indexB = order.get(b.symbol) ?? 0;
      return indexA - indexB;
    });
  }, [stocksQuery.data, trackedSymbols]);

  const heroStats = [
    {
      label: "Tracked assets",
      value: trackedSymbols.length ? `${trackedSymbols.length} symbols` : "None yet",
      accent: trackedSymbols.length ? "Tap chips to reorder" : "Start searching",
    },
    {
      label: "Auto refresh",
      value: `${refreshInterval}s`,
      accent: "Settings tab to tweak",
    },
    {
      label: "Live quotes",
      value:
        stocksQuery.data && stocksQuery.data.length
          ? `${stocksQuery.data.length} cards`
          : "Waiting for selections",
      accent: stocksQuery.isFetching ? "Updating…" : "Idle",
    },
  ];

  return (
    <section className="page">
      <AuroraBackground variant="dashboard">
        <div className="hero-panel" ref={heroRef}>
          <div>
            <p className="eyebrow">Mission control</p>
            <h1>Personalized stock intelligence.</h1>
          </div>
          <div className="hero-actions">
            <button type="button">
              Focus dashboard
            </button>
            <Link to="/docs" className="ghost button-link">
              Jump to docs
            </Link>
          </div>
        </div>
        <div className="hero-stats" ref={statsRef}>
          {heroStats.map((stat) => (
            <div key={stat.label} data-animate-item>
              <NeonStat
                label={stat.label}
                value={stat.value}
                accent={<span>{stat.accent}</span>}
              />
            </div>
          ))}
        </div>
      </AuroraBackground>
      <div className="card">
        <h2>Track Stocks</h2>
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleAddSymbol}
          suggestions={searchQuery.data ?? []}
          onSelectSuggestion={handleSelectSuggestion}
          loading={searchQuery.isFetching}
        />
        <TrackedSymbols
          symbols={trackedSymbols}
          onRemove={handleRemoveSymbol}
        />
        <div className="card-actions">
          <button
            type="button"
            onClick={() => stocksQuery.refetch()}
            disabled={!trackedSymbols.length || stocksQuery.isFetching}
          >
            {stocksQuery.isFetching ? "Refreshing…" : "Refresh now"}
          </button>
          <span className="muted">
            Auto refresh every {refreshInterval}s
          </span>
        </div>
      </div>

      {stocksQuery.error && (
        <div className="card error">
          Failed to load quotes: {(stocksQuery.error as Error).message}
        </div>
      )}

      {noData && (
        <div className="card warning">
          No data returned. Double-check the stock symbols.
        </div>
      )}

      <div className="grid">
        {sortedQuotes.map((quote) => (
          <StockCard key={quote.symbol} quote={quote} />
        ))}
        {!trackedSymbols.length && (
          <div className="placeholder">
            Start by searching for a company to populate your dashboard.
          </div>
        )}
      </div>
    </section>
  );
}
