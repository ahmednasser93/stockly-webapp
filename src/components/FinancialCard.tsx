interface FinancialCardProps {
  label: string;
  value: string | number;
}

export function FinancialCard({ label, value }: FinancialCardProps) {
  return (
    <div className="group bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{value}</div>
    </div>
  );
}

