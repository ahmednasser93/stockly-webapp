import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStockNews, fetchMultipleStockNews } from "../api/news";
import { getFavoriteStocks } from "../api/favoriteStocks";
import { getUserSettings } from "../api/userSettings";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown } from "lucide-react";

interface NewsItem {
  title: string;
  text: string;
  url: string;
  publishedDate: string;
  image: string | null;
  site: string;
  symbol?: string | null;
}

export function NewsFeedPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch favorite stocks for news
  const { data: favoriteStocks } = useQuery({
    queryKey: ["favoriteStocks"],
    queryFn: getFavoriteStocks,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user settings to get news favorite symbols
  const { data: userSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: getUserSettings,
    staleTime: 5 * 60 * 1000,
  });

  // Get all available symbols (from favorite stocks + news favorite symbols)
  const availableSymbols = [
    ...(favoriteStocks?.map((s) => s.symbol) || []),
    ...(userSettings?.newsFavoriteSymbols || []),
  ]
    .filter((s, i, arr) => arr.indexOf(s) === i) // Remove duplicates
    .sort();

  // Set default to first symbol when available
  useEffect(() => {
    if (selectedSymbol === null && availableSymbols.length > 0) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setSelectedSymbol(availableSymbols[0]);
      }, 0);
    }
  }, [availableSymbols, selectedSymbol]);

  // Fetch news based on selected symbol
  const { data: newsData, isLoading } = useQuery({
    queryKey: ["news", selectedSymbol || "all"],
    queryFn: async () => {
      if (!selectedSymbol || selectedSymbol === "all") {
        // Fetch news for all favorite symbols
        if (availableSymbols.length === 0) {
          return { news: [], pagination: { page: 0, limit: 20, total: 0, hasMore: false } };
        }
        return fetchMultipleStockNews(availableSymbols, { page: 0, limit: 50 });
      } else {
        return fetchStockNews(selectedSymbol, { page: 0, limit: 50 });
      }
    },
    enabled: availableSymbols.length > 0 || selectedSymbol === "all",
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Handle both single symbol response (news array) and multiple symbols response (news array)
  const newsItems: NewsItem[] = newsData?.news || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">News Feed</h1>

          {/* Filter Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-slate-400 transition-colors"
              >
                <span className="text-slate-900 font-medium">
                  {selectedSymbol === null || selectedSymbol === "all"
                    ? "All stocks"
                    : selectedSymbol}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedSymbol("all");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                        (selectedSymbol === null || selectedSymbol === "all")
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-900"
                      }`}
                    >
                      All stocks
                    </button>
                    {availableSymbols.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => {
                          setSelectedSymbol(symbol);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                          selectedSymbol === symbol
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-900"
                        }`}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 h-48"
                />
              ))}
            </div>
          ) : newsItems.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 p-12 text-center">
              <p className="text-slate-500">
                {selectedSymbol === "all" || selectedSymbol === null
                  ? "No news available for your favorite stocks."
                  : `No news available for ${selectedSymbol}.`}
              </p>
            </div>
          ) : (
            newsItems.map((item, index) => (
              <NewsArticleCard key={`${item.url}-${index}`} item={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NewsArticleCard({ item }: { item: NewsItem }) {
  const timeAgo = item.publishedDate
    ? formatDistanceToNow(new Date(item.publishedDate), { addSuffix: true })
    : "";

  // Format time to "10h" format if less than 24 hours
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const match = timeStr.match(/(\d+)\s*(hour|minute|second)/);
    if (match) {
      const num = match[1];
      const unit = match[2];
      if (unit === "hour") return `${num}h`;
      if (unit === "minute") return `${num}m`;
      if (unit === "second") return `${num}s`;
    }
    return timeStr;
  };

  const displayTime = formatTime(timeAgo);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden hover:shadow-md transition-all group"
    >
      {/* Large Banner Image */}
      {item.image && (
        <div className="w-full h-48 lg:h-64 bg-slate-100 overflow-hidden relative">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Source and Time */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {item.symbol && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold uppercase">
                {item.symbol}
              </span>
            )}
            <span className="text-slate-500">
              {item.site || "Unknown Source"}
            </span>
          </div>
          {displayTime && (
            <span className="text-slate-400">{displayTime}</span>
          )}
        </div>

        {/* Headline */}
        <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
          {item.title}
        </h3>

        {/* Description */}
        {item.text && (
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {item.text}
          </p>
        )}
      </div>
    </a>
  );
}

