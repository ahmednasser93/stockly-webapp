interface FinancialCardProps {
  label: string;
  value: string | number;
}

export function FinancialCard({ label, value }: FinancialCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
      <div className="text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">{label}</div>
      <div className="text-base font-bold text-gray-900">{value}</div>
    </div>
  );
}

