interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "error" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "rgba(34, 197, 94, 0.1)",
      border: "1px solid rgba(34, 197, 94, 0.3)",
      color: "#22c55e",
    },
    secondary: {
      background: "var(--ghost-border)",
      border: "1px solid var(--ghost-border)",
      color: "var(--text-primary)",
    },
    success: {
      background: "rgba(34, 197, 94, 0.1)",
      border: "1px solid rgba(34, 197, 94, 0.3)",
      color: "#22c55e",
    },
    error: {
      background: "rgba(248, 113, 113, 0.1)",
      border: "1px solid rgba(248, 113, 113, 0.3)",
      color: "#f87171",
    },
    warning: {
      background: "rgba(245, 158, 11, 0.1)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      color: "#f59e0b",
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

