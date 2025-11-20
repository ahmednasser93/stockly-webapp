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
      className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex gap-3 hover:shadow-lg hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
    >
      {image && (
        <img
          src={image}
          alt={news.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
          onError={(e) => {
            // Hide image if it fails to load
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
          {news.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>{source}</span>
          <span>•</span>
          <span>{formatRelativeTime(news.publishedDate)}</span>
        </div>
        {summary && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {summary.length > 200 ? `${summary.substring(0, 200)}...` : summary}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
          <span>Read more</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}

