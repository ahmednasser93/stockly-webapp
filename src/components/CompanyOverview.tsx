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
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Company Overview
      </h3>

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

