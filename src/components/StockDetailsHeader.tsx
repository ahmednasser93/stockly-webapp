import { useNavigate } from "react-router-dom";
import * as Toggle from "@radix-ui/react-toggle";
import { ArrowLeft, Bell, Star, TrendingUp, TrendingDown } from "lucide-react";
import type { StockProfile, StockQuote } from "../types/stockDetails";
import { formatCurrency, formatPercentage } from "../utils/formatters";
import { useState } from "react";

interface StockDetailsHeaderProps {
  symbol: string;
  profile: StockProfile;
  quote: StockQuote;
}

export function StockDetailsHeader({
  symbol,
  profile,
  quote,
}: StockDetailsHeaderProps) {
  const navigate = useNavigate();
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isAlertSet, setIsAlertSet] = useState(false);

  const isPositive = quote.changesPercentage >= 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const changeBg = isPositive 
    ? "bg-green-50 border-green-200" 
    : "bg-red-50 border-red-200";

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 stock-details-header">
      <div className="max-w-xl mx-auto px-4 py-5">
        {/* Top row: Back button and actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Toggle.Root
              pressed={isAlertSet}
              onPressedChange={setIsAlertSet}
              className="p-2.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-200 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 data-[state=on]:border data-[state=on]:border-blue-200 hover:scale-105 active:scale-95"
              aria-label="Set alert"
            >
              <Bell className="w-5 h-5" />
            </Toggle.Root>
            <Toggle.Root
              pressed={isWatchlisted}
              onPressedChange={setIsWatchlisted}
              className="p-2.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-200 data-[state=on]:bg-yellow-50 data-[state=on]:text-yellow-600 data-[state=on]:border data-[state=on]:border-yellow-200 hover:scale-105 active:scale-95"
              aria-label="Add to watchlist"
            >
              <Star className={`w-5 h-5 ${isWatchlisted ? "fill-yellow-600" : ""}`} />
            </Toggle.Root>
          </div>
        </div>

        {/* Symbol and company name */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            {profile.image && (
              <div className="relative">
                <img
                  src={profile.image}
                  alt={profile.companyName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200 shadow-md"
                  loading="lazy"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent pointer-events-none"></div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{symbol}</h1>
              <p className="text-sm text-gray-600 font-medium truncate">{profile.companyName}</p>
            </div>
          </div>
        </div>

        {/* Price and change */}
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {formatCurrency(quote.price)}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${changeBg} ${changeColor} transition-all duration-200`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-base font-bold">
              {isPositive ? "+" : ""}
              {formatCurrency(quote.change)}
            </span>
            <span className="text-sm font-semibold opacity-90">
              ({formatPercentage(quote.changesPercentage)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

