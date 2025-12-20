import { TrendingUp, Bell, Smartphone } from "lucide-react";

export interface UserCardData {
  username: string;
  email?: string;
  stocks: string[];
  alerts?: number;
  devices?: number;
}

interface UserCardProps {
  user: UserCardData;
  onClick: () => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  const stockCount = user.stocks?.length || 0;
  const alertCount = user.alerts || 0;
  const deviceCount = user.devices || 0;

  return (
    <div
      onClick={onClick}
      className="user-card"
      style={{
        background: "var(--surface-color)",
        border: "1px solid var(--ghost-border)",
        borderRadius: "1rem",
        padding: "1rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>
          @{user.username}
        </div>
        {user.email && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {user.email}
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--ghost-border)",
          paddingTop: "0.75rem",
          marginTop: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <TrendingUp style={{ width: "14px", height: "14px" }} />
          <span>Stocks</span>
          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{stockCount}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <Bell style={{ width: "14px", height: "14px" }} />
          <span>Alerts</span>
          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{alertCount}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <Smartphone style={{ width: "14px", height: "14px" }} />
          <span>Devices</span>
          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{deviceCount}</span>
        </div>
      </div>
    </div>
  );
}

