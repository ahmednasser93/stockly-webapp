import { useState } from "react";
import type { StockProfile } from "../types/stockDetails";
import { ExternalLink } from "lucide-react";

interface CompanyOverviewProps {
  profile: StockProfile;
}

export function CompanyOverview({ profile }: CompanyOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = profile.description || "";
  const shouldTruncate = description.length > 150;

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200/60 backdrop-blur-sm bg-white/95 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
        <h3 className="text-xl font-bold text-slate-900">
          Company Overview
        </h3>
      </div>

      <div className="space-y-4">
        {profile.sector && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Sector</span>
            <span className="text-sm font-semibold text-slate-900 flex-1">
              {profile.sector}
            </span>
          </div>
        )}

        {profile.industry && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Industry</span>
            <span className="text-sm font-semibold text-slate-900 flex-1">
              {profile.industry}
            </span>
          </div>
        )}

        {profile.website && (
          <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 font-semibold group"
            >
              <span className="group-hover:underline">{profile.website}</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        )}

        {description && (
          <div className="pt-2">
            <p
              className={`text-sm text-slate-700 leading-relaxed ${
                !isExpanded && shouldTruncate ? "line-clamp-4" : ""
              }`}
            >
              {description}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                {isExpanded ? (
                  <>
                    <span>Show Less</span>
                    <span className="group-hover:-translate-y-0.5 transition-transform">↑</span>
                  </>
                ) : (
                  <>
                    <span>Show More</span>
                    <span className="group-hover:translate-y-0.5 transition-transform">↓</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

