import { useNavigate } from "react-router-dom";
import * as Toggle from "@radix-ui/react-toggle";
import { ArrowLeft, Bell, Star } from "lucide-react";
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

  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-xl mx-auto px-4 py-4">
        {/* Top row: Back button and actions */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Toggle.Root
              pressed={isAlertSet}
              onPressedChange={setIsAlertSet}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"
              aria-label="Set alert"
            >
              <Bell className="w-5 h-5" />
            </Toggle.Root>
            <Toggle.Root
              pressed={isWatchlisted}
              onPressedChange={setIsWatchlisted}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"
              aria-label="Add to watchlist"
            >
              <Star className="w-5 h-5" />
            </Toggle.Root>
          </div>
        </div>

        {/* Symbol and company name */}
        <div className="mb-2">
          <div className="flex items-center gap-3">
            {profile.image && (
              <img
                src={profile.image}
                alt={profile.companyName}
                className="w-12 h-12 rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{symbol}</h1>
              <p className="text-sm text-gray-600">{profile.companyName}</p>
            </div>
          </div>
        </div>

        {/* Price and change */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(quote.price)}
          </span>
          <span
            className={`text-lg font-semibold ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(quote.change)} ({formatPercentage(quote.changesPercentage)})
          </span>
        </div>
      </div>
    </div>
  );
}

