import type { ReactNode } from "react";

interface KeyStatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  variant?: "primary" | "success" | "danger" | "info" | "warning";
}

const variantStyles = {
  primary: {
    iconBg: "bg-gradient-to-br from-blue-500 to-purple-600",
    iconColor: "text-white",
    accent: "from-blue-500 to-purple-600",
  },
  success: {
    iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    iconColor: "text-white",
    accent: "from-green-500 to-emerald-600",
  },
  danger: {
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    iconColor: "text-white",
    accent: "from-red-500 to-rose-600",
  },
  info: {
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
    iconColor: "text-white",
    accent: "from-cyan-500 to-blue-600",
  },
  warning: {
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    iconColor: "text-white",
    accent: "from-amber-500 to-orange-600",
  },
};

export function KeyStatCard({ 
  icon, 
  label, 
  value,
  variant = "primary"
}: KeyStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg p-5 border border-slate-200/60 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1 key-stat-card overflow-hidden">
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${styles.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      <div className="flex items-start justify-between mb-3">
        <div className={`${styles.iconBg} ${styles.iconColor} p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      
      <div className="space-y-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          {label}
        </span>
        <div className={`text-2xl font-bold bg-gradient-to-r ${styles.accent} bg-clip-text text-transparent`}>
          {value}
        </div>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
    </div>
  );
}

