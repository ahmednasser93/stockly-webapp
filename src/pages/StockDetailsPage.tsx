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

  // Loading State
  const showSkeleton = isLoading && !data;
  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] p-6">
        <LoadingBar isLoading={true} />
        <div className="max-w-[1400px] mx-auto bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] p-8 animate-pulse">
          <div className="h-10 bg-slate-100 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 h-[600px] bg-slate-50 rounded"></div>
            <div className="col-span-4 space-y-4">
              <div className="h-64 bg-slate-50 rounded"></div>
              <div className="h-64 bg-slate-50 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-red-200 max-w-md text-center">
          <h3 className="text-red-900 font-semibold text-lg mb-2">Unavailable</h3>
          <p className="text-slate-600 mb-6">{error?.message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, quote } = data;
  const chartData = historicalData?.historical?.map((d: any) => ({
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
  const priceColor = isPositive ? "text-green-600" : "text-[#d63031]";

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-4 lg:p-8 font-sans text-slate-900">
      <LoadingBar isLoading={isFetching} />

      {/* Main Container Card */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-[20px] shadow-sm border border-slate-200/60 overflow-hidden">

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

          {/* LEFT COLUMN (65%) */}
          <div className="lg:col-span-8 p-6 lg:p-10 space-y-8">

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">
                {data.symbol} <span className="text-slate-400 font-normal ml-2 text-xl">- {profile.companyName}</span>
              </h1>

              <div className="mt-4 flex items-baseline gap-4">
                <span className="text-[48px] font-bold tracking-tight text-slate-900 leading-none">
                  {formatCurrency(quote.price)}
                </span>
                <span className={`text-xl font-semibold flex items-center gap-1 ${priceColor}`}>
                  {isPositive ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                  {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Chart Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as ChartPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${chartPeriod === period
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {chartPeriod === "1W" && (
                <button
                  onClick={() => setShowCandlestick(!showCandlestick)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${showCandlestick
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "text-slate-600 hover:text-slate-900 bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                >
                  {showCandlestick ? "Line Chart" : "Candlesticks"}
                </button>
              )}
            </div>

            {/* Main Chart Area */}
            <div className="h-[450px] w-full bg-white relative">
              {showCandlestick && chartPeriod === "1W" ? (
                <CandlestickChart data={chartData} />
              ) : (
                <Chart data={chartData} period={chartPeriod} />
              )}
            </div>

            {/* Key Price Indicators (Footer of Left Col) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
              <FooterStat label="Open" value={formatCurrency(quote.open)} />
              <FooterStat label="High" value={formatCurrency(quote.dayHigh)} />
              <FooterStat label="Low" value={formatCurrency(quote.dayLow)} />
              <FooterStat label="Prev Close" value={formatCurrency(quote.previousClose)} />
            </div>

            {/* MOVED: A. Trading Metrics Card */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Key Metrics</h3>
              <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200/60 p-5">
                {/* Changed grid-cols-2 to grid-cols-3 lg:grid-cols-6 for wider layout */}
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-4">
                  <MetricItem label="Open" value={formatCurrency(quote.open)} />
                  <MetricItem label="Prev Close" value={formatCurrency(quote.previousClose)} />
                  <MetricItem label="High" value={formatCurrency(quote.dayHigh)} />
                  <MetricItem label="Low" value={formatCurrency(quote.dayLow)} />
                  <MetricItem label="Volume" value={formatVolume(quote.volume)} />
                  <MetricItem label="Market Cap" value={formatLargeNumber(quote.marketCap)} />
                </div>
              </div>
            </div>

            {/* MOVED: B. Company Information Card */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">Company Overview</h3>
              <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200/60 p-5 space-y-5">
                <p className="text-sm text-slate-600 leading-relaxed transition-all cursor-default">
                  {profile.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-50">
                  <InfoRow label="Industry" value={profile.industry || "N/A"} />
                  <InfoRow label="Sector" value={profile.sector || "N/A"} />
                  {profile.website && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 font-medium text-sm">Website</span>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-semibold">
                        {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (35%) */}
          <div className="lg:col-span-4 bg-slate-50/30 p-6 lg:p-8 space-y-8">



            {/* C. News Feed Card */}
            <StockNewsFeed symbol={symbol || ""} />

          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Helper Components for this specific high-fidelity design

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-lg font-bold text-slate-900">{value}</span>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-base font-bold text-slate-900 tabular-nums tracking-tight">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-900 font-semibold text-right max-w-[60%]">{value}</span>
    </div>
  );
}
