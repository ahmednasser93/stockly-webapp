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

  return (
    <div className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl shadow-xl border-b border-slate-200/60 stock-details-header">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Top row: Back button and actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="group p-3 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
          </button>
          <div className="flex items-center gap-3">
            <Toggle.Root
              pressed={isAlertSet}
              onPressedChange={setIsAlertSet}
              className="group p-3 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-all duration-200 data-[state=on]:bg-gradient-to-br data-[state=on]:from-blue-500 data-[state=on]:to-purple-600 data-[state=on]:text-white data-[state=on]:shadow-lg hover:scale-105 active:scale-95"
              aria-label="Set alert"
            >
              <Bell className="w-5 h-5 group-data-[state=on]:text-white" />
            </Toggle.Root>
            <Toggle.Root
              pressed={isWatchlisted}
              onPressedChange={setIsWatchlisted}
              className="group p-3 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-all duration-200 data-[state=on]:bg-gradient-to-br data-[state=on]:from-amber-400 data-[state=on]:to-orange-500 data-[state=on]:text-white data-[state=on]:shadow-lg hover:scale-105 active:scale-95"
              aria-label="Add to watchlist"
            >
              <Star className={`w-5 h-5 group-data-[state=on]:fill-white group-data-[state=on]:text-white`} />
            </Toggle.Root>
          </div>
        </div>

        {/* Symbol and company name */}
        <div className="mb-6">
          <div className="flex items-center gap-5">
            {profile.image && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50"></div>
                <img
                  src={profile.image}
                  alt={profile.companyName}
                  className="relative w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                {symbol}
              </h1>
              <p className="text-base text-slate-600 font-semibold truncate">
                {profile.companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Price and change */}
        <div className="flex items-baseline gap-6 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {formatCurrency(quote.price)}
            </span>
          </div>
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 shadow-lg transition-all duration-300 ${
            isPositive 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700" 
              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700"
          }`}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="text-lg font-bold">
              {isPositive ? "+" : ""}
              {formatCurrency(quote.change)}
            </span>
            <span className="text-sm font-bold opacity-90">
              ({formatPercentage(quote.changesPercentage)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

