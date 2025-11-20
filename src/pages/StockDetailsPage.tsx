import { useState } from "react";
import { useParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { useStockDetails } from "../hooks/useStockDetails";
import { StockDetailsHeader } from "../components/StockDetailsHeader";
import { Chart } from "../components/Chart";
import { KeyStatCard } from "../components/KeyStatCard";
import { CompanyOverview } from "../components/CompanyOverview";
import { FinancialsSection } from "../components/FinancialsSection";
import { NewsCard } from "../components/NewsCard";
import { PeersList } from "../components/PeersList";
import type { ChartPeriod } from "../types/stockDetails";
import {
  formatCurrency,
  formatLargeNumber,
  formatVolume,
} from "../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  BarChart3,
} from "lucide-react";

export function StockDetailsPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { data, isLoading, isError, error, refetch } = useStockDetails(
    symbol || ""
  );
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("1D");

  // Enhanced loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50">
          <div className="max-w-xl mx-auto px-4 py-5">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 bg-gray-300 rounded-xl"></div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 bg-gray-300 rounded-xl"></div>
                  <div className="h-10 w-10 bg-gray-300 rounded-xl"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-300 rounded-2xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 bg-gray-300 rounded-lg w-32"></div>
                <div className="h-8 bg-gray-300 rounded-lg w-24"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-200">
            <div className="h-[300px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-32 animate-pulse"></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-48 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h3 className="font-semibold text-red-900">
              Failed to load stock details
            </h3>
          </div>
          <p className="text-sm text-red-700 mb-4">
            {error?.message || "Unknown error occurred"}
          </p>
          <button
            onClick={() => refetch()}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">No stock data available</p>
        </div>
      </div>
    );
  }

  const { profile, quote, chart, financials, news, peers } = data;
  const chartData = chart[chartPeriod] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 stock-details-page">
      <StockDetailsHeader
        symbol={data.symbol}
        profile={profile}
        quote={quote}
      />

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200/50 hover:shadow-xl transition-all duration-300 stock-details-card">
          <Tabs.Root
            value={chartPeriod}
            onValueChange={(value) => setChartPeriod(value as ChartPeriod)}
            className="w-full"
          >
            <Tabs.List className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto pb-1">
              {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as ChartPeriod[]).map(
                (period) => (
                  <Tabs.Trigger
                    key={period}
                    value={period}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-t-lg transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 whitespace-nowrap hover:text-gray-900 hover:bg-gray-50"
                  >
                    {period}
                  </Tabs.Trigger>
                )
              )}
            </Tabs.List>
            <Tabs.Content value={chartPeriod} className="mt-2">
              <Chart data={chartData} period={chartPeriod} />
            </Tabs.Content>
          </Tabs.Root>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <KeyStatCard
            icon={<ArrowUp className="w-5 h-5" />}
            label="Open"
            value={formatCurrency(quote.open)}
          />
          <KeyStatCard
            icon={<ArrowDown className="w-5 h-5" />}
            label="Previous Close"
            value={formatCurrency(quote.previousClose)}
          />
          <KeyStatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Day High"
            value={formatCurrency(quote.dayHigh)}
          />
          <KeyStatCard
            icon={<TrendingDown className="w-5 h-5" />}
            label="Day Low"
            value={formatCurrency(quote.dayLow)}
          />
          <KeyStatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Volume"
            value={formatVolume(quote.volume)}
          />
          <KeyStatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Market Cap"
            value={formatLargeNumber(quote.marketCap)}
          />
        </div>

        {/* Company Overview */}
        <div className="stock-details-card">
          <CompanyOverview profile={profile} />
        </div>

        {/* Financials Section */}
        <div className="stock-details-card">
          <FinancialsSection financials={financials} />
        </div>

        {/* News Section */}
        {news && news.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200/50 stock-details-card">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">
                Latest News
              </h3>
            </div>
            <div className="space-y-3">
              {news.map((item, index) => (
                <NewsCard key={index} news={item} />
              ))}
            </div>
          </div>
        )}

        {/* Peers Section */}
        <div className="stock-details-card">
          <PeersList peers={peers} />
        </div>
      </div>
    </div>
  );
}

