import type { ReactNode } from "react";
import "./glassCard.css";

export type GlassCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "gradient";
  hover?: boolean;
};

export function GlassCard({
  children,
  className = "",
  variant = "default",
  hover = true,
}: GlassCardProps) {
  return (
    <div className={`glass-card glass-card--${variant} ${hover ? "glass-card--hover" : ""} ${className}`}>
      <div className="glass-card__glow" />
      <div className="glass-card__content">{children}</div>
    </div>
  );
}

