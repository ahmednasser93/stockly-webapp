import { useState } from "react";
import { useParams } from "react-router-dom";
import { useStockDetails } from "../hooks/useStockDetails";
import { Chart } from "../components/Chart";
import { CandlestickChart } from "../components/CandlestickChart";
import { useQuery } from "@tanstack/react-query";
import { LoadingBar } from "../components/LoadingBar";
import { StockNewsFeed } from "../components/StockNewsFeed";
import type { ChartPeriod } from "../types/stockDetails";
import {
  formatCurrency,
  formatLargeNumber,
  formatVolume,
} from "../utils/formatters";
import {
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";

import { API_BASE_URL } from "../api/client";

export function StockDetailsPage() {
  const { symbol } = useParams<{ symbol: string }>();
  // Mark as staleTime: 0 so we see the loading bar on revisit, or keep cache but show fetching
  const { data, isLoading, isError, error, refetch, isFetching } = useStockDetails(
    symbol || ""
  );
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("1W");
  const [showCandlestick, setShowCandlestick] = useState(false);

  // Calculate date range based on period
  const getDateRange = (period: ChartPeriod) => {
    const to = new Date();
    const from = new Date();

    switch (period) {
      case "1D": from.setDate(to.getDate() - 1); break;
      case "1W": from.setDate(to.getDate() - 7); break;
      case "1M": from.setMonth(to.getMonth() - 1); break;
      case "3M": from.setMonth(to.getMonth() - 3); break;
      case "1Y": from.setFullYear(to.getFullYear() - 1); break;
      case "ALL": from.setFullYear(to.getFullYear() - 5); break; // Default to 5 years for ALL
      default: from.setDate(to.getDate() - 7);
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  };

  const { from, to } = getDateRange(chartPeriod);

  // Generalize query to fetch for any selected period
  const { data: historicalData } = useQuery({
    queryKey: ["historical", symbol, chartPeriod],
    queryFn: async () => {
      // Use different endpoint/params for 1D specific high-res data if needed, 
      // but sticking to get-historical for now as requested.
      // Note: "1D" is Intraday usually, but user asked for "get-historical" endpoint logic.
      // If 1D needs intraday, we might need a separate condition, but assuming get-historical works generally.

      const response = await fetch(
        `${API_BASE_URL}/v1/api/get-historical?symbol=${symbol}&from=${from}&to=${to}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch historical data");
      return response.json();
    },
    enabled: !!symbol,
    refetchOnWindowFocus: false,
  });

  // Loading State - Minimal skeleton
  const showSkeleton = isLoading && !data;
  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 lg:p-6">
        <LoadingBar isLoading={true} />
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 lg:p-8 animate-pulse">
            <div className="h-8 bg-slate-100 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-slate-100 rounded w-1/4"></div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 lg:p-8 h-[500px] animate-pulse">
            <div className="h-full bg-slate-50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error State - Minimal design
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-slate-200/50 max-w-md text-center">
          <h3 className="text-slate-900 font-semibold text-lg mb-2">Unable to Load</h3>
          <p className="text-slate-600 mb-6 text-sm">{error?.message}</p>
          <button 
            onClick={() => refetch()} 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, quote } = data;
  interface HistoricalDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }
  const chartData = historicalData?.historical?.map((d: HistoricalDataPoint) => ({
    date: d.date,
    price: d.close,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
  })).reverse() || []; // Reverse if API returns newest first (FMP usually does)


  // Price Change Logic
  const priceChange = quote.change;
  const priceChangePercent = quote.changesPercentage;
  const isPositive = priceChange >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 lg:p-6 font-sans text-slate-900">
      <LoadingBar isLoading={isFetching} />

      {/* Main Container - Cleaner, more minimal */}
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header Card - Minimal, clean */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                  {data.symbol}
                </h1>
                <span className="text-slate-400 text-sm lg:text-base font-medium">
                  {profile.companyName}
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-none">
                  {formatCurrency(quote.price)}
                </span>
                <span className={`text-base lg:text-lg font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section - Clean, minimal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 lg:p-8">
          {/* Chart Controls - Minimal design */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-slate-50/80 p-1 rounded-xl gap-1">
              {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as ChartPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${chartPeriod === period
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {chartPeriod === "1W" && (
              <button
                onClick={() => setShowCandlestick(!showCandlestick)}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-all ${showCandlestick
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                  }`}
              >
                {showCandlestick ? "Line" : "Candles"}
              </button>
            )}
          </div>

          {/* Main Chart Area - Cleaner background */}
          <div className="h-[400px] lg:h-[500px] w-full relative -mx-2">
            {showCandlestick && chartPeriod === "1W" ? (
              <CandlestickChart data={chartData} />
            ) : (
              <Chart data={chartData} period={chartPeriod} />
            )}
          </div>

          {/* Key Price Indicators - Minimal grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-slate-100">
            <FooterStat label="Open" value={formatCurrency(quote.open)} />
            <FooterStat label="High" value={formatCurrency(quote.dayHigh)} />
            <FooterStat label="Low" value={formatCurrency(quote.dayLow)} />
            <FooterStat label="Prev Close" value={formatCurrency(quote.previousClose)} />
          </div>
        </div>

        {/* Content Grid - Two columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Main content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Key Metrics - Minimal card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 lg:p-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <MetricItem label="Open" value={formatCurrency(quote.open)} />
                <MetricItem label="Prev Close" value={formatCurrency(quote.previousClose)} />
                <MetricItem label="High" value={formatCurrency(quote.dayHigh)} />
                <MetricItem label="Low" value={formatCurrency(quote.dayLow)} />
                <MetricItem label="Volume" value={formatVolume(quote.volume)} />
                <MetricItem label="Market Cap" value={formatLargeNumber(quote.marketCap)} />
              </div>
            </div>

            {/* Company Overview - Clean, minimal */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 lg:p-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Company Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {profile.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                <InfoRow label="Industry" value={profile.industry || "N/A"} />
                <InfoRow label="Sector" value={profile.sector || "N/A"} />
                {profile.website && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Website</span>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:text-blue-600 flex items-center gap-1.5 text-sm font-medium transition-colors">
                      {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - News feed (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6 lg:p-8 sticky top-6">
              <StockNewsFeed symbol={symbol || ""} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Minimal Helper Components

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-base font-bold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}
