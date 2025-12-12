import { formatRelativeTime } from "../utils/formatters";
import { ExternalLink } from "lucide-react";
import type { NewsItem } from "../types/news";
import type { StockNews as StockDetailsNews } from "../types/stockDetails";

interface NewsCardProps {
  news: NewsItem | StockDetailsNews;
}

export function NewsCard({ news }: NewsCardProps) {
  // Handle both NewsItem (from get-news API) and StockNews (from stock-details API)
  const source = "source" in news ? news.source : news.site;
  const summary = "summary" in news ? news.summary : ("text" in news ? news.text : undefined);
  const image = news.image;

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl shadow-lg p-5 border border-slate-200/60 flex gap-4 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 overflow-hidden relative"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/30 transition-all duration-300 pointer-events-none"></div>
      
      {image && (
        <div className="relative flex-shrink-0">
          <img
            src={image}
            alt={news.title}
            className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200 group-hover:border-blue-300 transition-all duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/20 group-hover:to-purple-600/20 transition-all duration-300 pointer-events-none"></div>
        </div>
      )}
      <div className="flex-1 min-w-0 relative z-10">
        <h4 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {news.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium">
          <span className="px-2 py-0.5 bg-slate-100 rounded-md">{source}</span>
          <span>•</span>
          <span>{formatRelativeTime(news.publishedDate)}</span>
        </div>
        {summary && (
          <p className="text-sm text-slate-600 line-clamp-3 mb-3 leading-relaxed">
            {summary.length > 200 ? `${summary.substring(0, 200)}...` : summary}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-blue-600 font-bold group-hover:text-blue-700 group-hover:gap-3 transition-all">
          <span>Read more</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </a>
  );
}

