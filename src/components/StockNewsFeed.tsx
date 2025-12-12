import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStockNews } from "../api/news";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StockNewsFeedProps {
    symbol: string;
}

export function StockNewsFeed({ symbol }: StockNewsFeedProps) {
    const [page, setPage] = useState(0);
    const limit = 20;

    // Calculate generic "last 30 days" range for the feed
    // ensuring we get relevant recent news.
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 30);

    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    const { data, isLoading, isPlaceholderData } = useQuery({
        queryKey: ["news", symbol, page, from, to],
        queryFn: () => fetchStockNews(symbol, { page, limit, from, to }),
        placeholderData: (previousData) => previousData, // Keep showing previous data while fetching next page
    });

    const newsItems = data?.news || [];
    const hasMore = data?.pagination?.hasMore || false; // Backend should populate this

    if (isLoading && !data) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 w-32 bg-slate-100 rounded"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-50 rounded-xl border border-slate-100"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">News</h3>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Page {page + 1}
                </span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore || isPlaceholderData}
                    className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight className="w-3 h-3" />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {newsItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No news found for this period.
                        </div>
                    ) : (
                        newsItems.map((item, i) => (
                            <a
                                key={`${item.url}-${i}`}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                {item.site || "News"}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {item.publishedDate ? formatDistanceToNow(new Date(item.publishedDate), { addSuffix: true }) : ''}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {item.title}
                                        </h4>
                                        {item.text && (
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {item.text}
                                            </p>
                                        )}
                                    </div>
                                    {item.image && (
                                        <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/50">
                                            <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    )}
                                </div>
                            </a>
                        ))
                    )}
                </div>
                {isPlaceholderData && (
                    <div className="p-2 text-center bg-slate-50 border-t border-slate-100">
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin mx-auto" />
                    </div>
                )}
            </div>
        </div>
    );
}
