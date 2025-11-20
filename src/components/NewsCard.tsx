import type { StockNews } from "../types/stockDetails";
import { formatRelativeTime } from "../utils/formatters";
import { ExternalLink } from "lucide-react";

interface NewsCardProps {
  news: StockNews;
}

export function NewsCard({ news }: NewsCardProps) {
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex gap-3 hover:shadow-md transition-shadow"
    >
      {news.image && (
        <img
          src={news.image}
          alt={news.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
          {news.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>{news.source}</span>
          <span>•</span>
          <span>{formatRelativeTime(news.publishedDate)}</span>
        </div>
        {news.summary && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {news.summary}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <span>Read more</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}

