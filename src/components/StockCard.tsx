import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { StockQuote } from "../types";
import { fetchStockDetails } from "../api/stockDetails";

function formatNumber(value: number | null, options?: Intl.NumberFormatOptions) {
  if (value === null || value === undefined) return "--";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

function formatVolume(value: number | null) {
  if (value === null || value === undefined) return "--";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toString();
}

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function StockCard({ quote }: { quote: StockQuote }) {
  const queryClient = useQueryClient();

  // Prefetch stock details on hover/touch
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["stockDetails", quote.symbol.toUpperCase()],
      queryFn: () => fetchStockDetails(quote.symbol.toUpperCase()),
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <Link
      to={`/stocks/${quote.symbol}`}
      className="stock-card-link"
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter}
    >
      <article className="stock-card">
        <header>
          <h3>{quote.symbol}</h3>
          <p className="price">{formatNumber(quote.price)}</p>
        </header>
        <dl>
          <div>
            <dt>Day Low</dt>
            <dd>{formatNumber(quote.dayLow)}</dd>
          </div>
          <div>
            <dt>Day High</dt>
            <dd>{formatNumber(quote.dayHigh)}</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd>{formatVolume(quote.volume)}</dd>
          </div>
        </dl>
        <footer>Last updated: {formatTimestamp(quote.timestamp)}</footer>
      </article>
    </Link>
  );
}
