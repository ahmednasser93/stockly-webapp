import { useStockNews, useMultipleStockNews } from "../hooks/useStockNews";
import { NewsCard } from "./NewsCard";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { NewsPaginationOptions } from "../types/news";

interface StockNewsProps {
  symbols: string[];
  maxItems?: number;
  showHeader?: boolean;
  enablePagination?: boolean;
  pagination?: NewsPaginationOptions;
}

export function StockNews({
  symbols,
  maxItems = 10,
  showHeader = true,
  enablePagination = false,
  pagination: initialPagination,
}: StockNewsProps) {
  const [pagination, setPagination] = useState<NewsPaginationOptions>({
    page: 0,
    limit: maxItems || 20,
    ...initialPagination,
  });

  const isSingleSymbol = symbols.length === 1;
  const singleSymbolQuery = useStockNews(
    symbols[0] || "",
    enablePagination ? pagination : undefined
  );
  const multipleSymbolsQuery = useMultipleStockNews(
    symbols,
    enablePagination ? pagination : undefined
  );

  const query = isSingleSymbol ? singleSymbolQuery : multipleSymbolsQuery;
  const { data, isLoading, isError, error } = query;

  const news = data?.news || [];
  const paginationData = data?.pagination;
  const limitedNews = enablePagination
    ? news
    : maxItems
    ? news.slice(0, maxItems)
    : news;
  const hasPartialData = data?.partial || false;
  const hasError = data?.error || false;

  const handleNextPage = () => {
    if (paginationData?.hasMore) {
      setPagination((prev) => ({
        ...prev,
        page: (prev.page || 0) + 1,
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination && (pagination.page || 0) > 0) {
      setPagination((prev) => ({
        ...prev,
        page: Math.max(0, (prev.page || 0) - 1),
      }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200/50 stock-details-card">
        {showHeader && (
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">Latest News</h3>
          </div>
        )}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200/50 stock-details-card">
        {showHeader && (
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">Latest News</h3>
          </div>
        )}
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <p className="text-sm text-red-700 mb-2">Failed to load news</p>
          <p className="text-xs text-gray-500">{error?.message || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (limitedNews.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200/50 stock-details-card">
        {showHeader && (
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">Latest News</h3>
          </div>
        )}
        <div className="text-center py-8">
          <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            {hasPartialData || hasError
              ? "No news available at this time"
              : "No news articles found"}
          </p>
          {hasError && data?.error && (
            <p className="text-xs text-gray-500 mt-2">{data.error}</p>
          )}
        </div>
      </div>
    );
  }

  // Warning for partial data
  const showWarning = hasPartialData || hasError;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200/50 stock-details-card">
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">Latest News</h3>
            {data?.cached && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                Cached
              </span>
            )}
          </div>
          {symbols.length > 0 && (
            <div className="text-xs text-gray-500">
              {symbols.length} {symbols.length === 1 ? "symbol" : "symbols"}
            </div>
          )}
        </div>
      )}

      {showWarning && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ {hasError ? data?.error : "Some news data may be incomplete"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {limitedNews.map((item, index) => (
          <NewsCard key={index} news={item} />
        ))}
      </div>

      {/* Pagination Controls */}
      {enablePagination && paginationData && (
        <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!pagination || (pagination.page || 0) === 0}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {paginationData.page + 1} • {paginationData.total} articles
            </span>
            <button
              onClick={handleNextPage}
              disabled={!paginationData.hasMore}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {paginationData.hasMore && (
            <p className="text-xs text-gray-500">
              More articles available
            </p>
          )}
        </div>
      )}

      {/* Show count if not using pagination */}
      {!enablePagination && news.length > maxItems && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Showing {maxItems} of {news.length} articles
          </p>
        </div>
      )}
    </div>
  );
}

