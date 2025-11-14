import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStocks, searchSymbols } from "../api/client";
import type { StockQuote } from "../types";
import { SearchBar } from "../components/SearchBar";
import { TrackedSymbols } from "../components/TrackedSymbols";
import { StockCard } from "../components/StockCard";
import { useSettings } from "../state/SettingsContext";

const TRACKED_STORAGE_KEY = "stockly-webapp-tracked";
type Tab = "dashboard" | "docs";

export function HomePage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [trackedSymbols, setTrackedSymbols] = useState<string[]>(() => {
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

  const { refreshInterval } = useSettings();

  useEffect(() => {
    localStorage.setItem(TRACKED_STORAGE_KEY, JSON.stringify(trackedSymbols));
  }, [trackedSymbols]);

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
    if (!trackedSymbols.includes(symbol)) {
      setTrackedSymbols((prev) => [...prev, symbol.toUpperCase()]);
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

  const dashboardContent = (
    <>
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
    </>
  );

  const docsContent = (
    <div className="card docs-card">
      <h2>Stockly API docs</h2>
      <p className="muted">
        Use the embedded Swagger reference to explore requests without
        leaving the dashboard.
      </p>
      <iframe
        src="/doc.html"
        title="Stockly API documentation"
        className="doc-frame"
      />
    </div>
  );

  return (
    <section className="page">
      <div className="card tab-bar">
        <button
          type="button"
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={activeTab === "docs" ? "active" : ""}
          onClick={() => setActiveTab("docs")}
        >
          API Docs
        </button>
      </div>
      {activeTab === "dashboard" ? dashboardContent : docsContent}
    </section>
  );
}
