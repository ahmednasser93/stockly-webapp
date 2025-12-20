import { Badge } from "./Badge";
import type { Alert } from "../types";

export interface UserDevice {
  username: string | null;
  pushToken: string;
  deviceInfo: string | null;
  deviceType: string | null;
  alertCount?: number;
  activeAlertCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetailData {
  username: string;
  email?: string;
  stocks: string[];
  alerts: Alert[];
  devices: UserDevice[];
}

interface UserDetailDialogProps {
  user: UserDetailData | null;
  onClose: () => void;
  onEditAlert?: (alert: Alert) => void;
  onDeleteAlert?: (alert: Alert) => void;
  onTestDevice?: (pushToken: string) => void;
  onDeleteDevice?: (pushToken: string) => void;
  isTestingDevice?: string | null;
  isDeletingDevice?: string | null;
}

export function UserDetailDialog({
  user,
  onClose,
  onEditAlert,
  onDeleteAlert,
  onTestDevice,
  onDeleteDevice,
  isTestingDevice,
  isDeletingDevice,
}: UserDetailDialogProps) {
  if (!user) return null;

  const parseDeviceInfo = (deviceInfo: string | null, deviceType: string | null): string => {
    if (deviceType) return deviceType;
    if (deviceInfo) {
      try {
        const parsed = JSON.parse(deviceInfo);
        if (parsed.platform && parsed.model) {
          return `${parsed.platform} ${parsed.model}`;
        } else if (parsed.platform) {
          return parsed.platform;
        } else if (typeof deviceInfo === "string" && !deviceInfo.startsWith("{")) {
          return deviceInfo;
        }
      } catch {
        if (typeof deviceInfo === "string") {
          return deviceInfo;
        }
      }
    }
    return "Unknown Device";
  };

  return (
    <div className="alert-form-overlay" onClick={onClose}>
      <div
        className="user-detail-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-color)",
          border: "1px solid var(--surface-border)",
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "42rem",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", fontWeight: "600" }}>
            User Overview
          </h2>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            @{user.username}
          </div>
          {user.email && (
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {user.email}
            </div>
          )}
        </div>

        {/* Favorite Stocks */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            Favorite Stocks
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {user.stocks.length > 0 ? (
              user.stocks.map((symbol) => (
                <Badge key={symbol} variant="default">
                  {symbol}
                </Badge>
              ))
            ) : (
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                No favorite stocks
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            Alerts ({user.alerts.length})
          </div>
          {user.alerts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {user.alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: "var(--bg)",
                    border: "1px solid var(--ghost-border)",
                  }}
                >
                  <div style={{ fontSize: "0.875rem" }}>
                    <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                      {alert.symbol}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {alert.direction === "above" ? "↑ Above" : "↓ Below"} ${alert.threshold.toFixed(2)}
                      {alert.status === "paused" && " (Paused)"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {onEditAlert && (
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => onEditAlert(alert)}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                      >
                        Edit
                      </button>
                    )}
                    {onDeleteAlert && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => onDeleteAlert(alert)}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              No alerts configured
            </span>
          )}
        </div>

        {/* Devices */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            Devices ({user.devices.length})
          </div>
          {user.devices.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {user.devices.map((device) => (
                <div
                  key={device.pushToken}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: "var(--bg)",
                    border: "1px solid var(--ghost-border)",
                  }}
                >
                  <div style={{ fontSize: "0.875rem", flex: 1 }}>
                    <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                      {parseDeviceInfo(device.deviceInfo, device.deviceType)}
                    </div>
                    <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {device.pushToken.substring(0, 40)}...
                    </div>
                    {device.activeAlertCount !== undefined && device.alertCount !== undefined && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        {device.activeAlertCount} active / {device.alertCount} total alerts
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {onTestDevice && (
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => onTestDevice(device.pushToken)}
                        disabled={isTestingDevice === device.pushToken}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                      >
                        {isTestingDevice === device.pushToken ? "Sending..." : "Test"}
                      </button>
                    )}
                    {onDeleteDevice && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => onDeleteDevice(device.pushToken)}
                        disabled={isDeletingDevice === device.pushToken}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              No devices registered
            </span>
          )}
        </div>

        {/* Close Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="ghost"
            onClick={onClose}
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

