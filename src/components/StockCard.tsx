import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "../state/SettingsContext";
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
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function calculatePriceChange(price: number | null, dayLow: number | null, dayHigh: number | null) {
  if (!price || !dayLow || !dayHigh || dayHigh === dayLow) return null;
  const range = dayHigh - dayLow;
  const position = (price - dayLow) / range;
  return position;
}

function getPriceTrend(price: number | null, dayLow: number | null, dayHigh: number | null) {
  if (!price || !dayLow || !dayHigh) return "neutral";
  const midPoint = (dayLow + dayHigh) / 2;
  if (price > midPoint * 1.02) return "up";
  if (price < midPoint * 0.98) return "down";
  return "neutral";
}

export function StockCard({ quote }: { quote: StockQuote }) {
  const queryClient = useQueryClient();
  const { cacheStaleTimeMinutes } = useSettings();

  const priceChange = calculatePriceChange(quote.price, quote.dayLow, quote.dayHigh);
  const trend = getPriceTrend(quote.price, quote.dayLow, quote.dayHigh);
  const range = quote.dayHigh && quote.dayLow ? quote.dayHigh - quote.dayLow : 0;
  const rangePercent = quote.price && quote.dayLow ? 
    ((quote.price - quote.dayLow) / range * 100).toFixed(1) : null;

  // Prefetch stock details on hover/touch
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["stockDetails", quote.symbol.toUpperCase()],
      queryFn: () => fetchStockDetails(quote.symbol.toUpperCase()),
      staleTime: cacheStaleTimeMinutes * 60 * 1000,
    });
  };

  return (
    <Link
      to={`/stocks/${quote.symbol}`}
      className="stock-card-link"
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter}
    >
      <article className={`stock-card stock-card--${trend}`}>
        <div className="stock-card__header">
          <div className="stock-card__symbol-section">
            <h3 className="stock-card__symbol">{quote.symbol}</h3>
            {rangePercent !== null && (
              <span className={`stock-card__trend stock-card__trend--${trend}`}>
                {trend === "up" && "↗"}
                {trend === "down" && "↘"}
                {trend === "neutral" && "→"}
                <span className="stock-card__trend-text">{rangePercent}%</span>
              </span>
            )}
          </div>
          <div className="stock-card__price-section">
            <p className="stock-card__price">{formatNumber(quote.price)}</p>
            {quote.dayLow && quote.dayHigh && (
              <div className="stock-card__range-bar">
                <div 
                  className="stock-card__range-fill" 
                  style={{ width: `${priceChange ? priceChange * 100 : 50}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="stock-card__stats">
          <div className="stock-card__stat">
            <span className="stock-card__stat-label">Low</span>
            <span className="stock-card__stat-value stock-card__stat-value--low">
              {formatNumber(quote.dayLow)}
            </span>
          </div>
          <div className="stock-card__stat stock-card__stat--center">
            <span className="stock-card__stat-label">Range</span>
            <span className="stock-card__stat-value">
              {formatNumber(range, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="stock-card__stat">
            <span className="stock-card__stat-label">High</span>
            <span className="stock-card__stat-value stock-card__stat-value--high">
              {formatNumber(quote.dayHigh)}
            </span>
          </div>
        </div>

        <div className="stock-card__footer">
          <div className="stock-card__volume">
            <span className="stock-card__volume-icon">📊</span>
            <span className="stock-card__volume-text">{formatVolume(quote.volume)}</span>
          </div>
          <time className="stock-card__timestamp">
            {formatTimestamp(quote.timestamp)}
          </time>
        </div>
      </article>
    </Link>
  );
}
