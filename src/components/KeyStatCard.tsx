import type { ReactNode } from "react";

interface KeyStatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function KeyStatCard({ icon, label, value }: KeyStatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-blue-600">{icon}</div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

