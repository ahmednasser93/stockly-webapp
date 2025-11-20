import type { ReactNode } from "react";

interface KeyStatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function KeyStatCard({ icon, label, value }: KeyStatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200/50 hover:shadow-lg hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5 key-stat-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-blue-600 p-1.5 bg-blue-50 rounded-lg">{icon}</div>
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

