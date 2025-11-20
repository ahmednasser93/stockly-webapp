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
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200/50">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
        <h3 className="text-xl font-bold text-gray-900">
          Company Overview
        </h3>
      </div>

      <div className="space-y-3">
        {profile.sector && (
          <div>
            <span className="text-sm text-gray-600">Sector: </span>
            <span className="text-sm font-medium text-gray-900">
              {profile.sector}
            </span>
          </div>
        )}

        {profile.industry && (
          <div>
            <span className="text-sm text-gray-600">Industry: </span>
            <span className="text-sm font-medium text-gray-900">
              {profile.industry}
            </span>
          </div>
        )}

        {profile.website && (
          <div>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>{profile.website}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {description && (
          <div>
            <p
              className={`text-sm text-gray-700 leading-relaxed ${
                !isExpanded && shouldTruncate ? "line-clamp-3" : ""
              }`}
            >
              {description}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2 font-medium"
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

