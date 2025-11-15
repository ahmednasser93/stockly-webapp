import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./gradientButton.css";

export type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

export function GradientButton({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={`gradient-btn gradient-btn--${variant} gradient-btn--${size} ${className}`}
      {...props}
    >
      <span className="gradient-btn__glow" />
      <span className="gradient-btn__content">
        {icon && <span className="gradient-btn__icon">{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
}

