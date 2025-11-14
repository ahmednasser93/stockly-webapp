import type { ReactNode } from "react";
import "./neonStat.css";

export type NeonStatProps = {
  label: string;
  value: string;
  accent?: ReactNode;
};

export function NeonStat({ label, value, accent }: NeonStatProps) {
  return (
    <div className="neon-stat">
      <div className="neon-stat__ring" />
      <div>
        <p className="neon-stat__label">{label}</p>
        <p className="neon-stat__value">{value}</p>
      </div>
      {accent && <div className="neon-stat__accent">{accent}</div>}
    </div>
  );
}
