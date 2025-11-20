interface FinancialCardProps {
  label: string;
  value: string | number;
}

export function FinancialCard({ label, value }: FinancialCardProps) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

