import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://stockly-api.ahmednasser1993.workers.dev");

interface NotificationLog {
  id: string;
  alertId: string;
  symbol: string;
  threshold: number;
  price: number;
  direction: string;
  pushToken: string;
  status: string;
  errorMessage?: string | null;
  attemptCount: number;
  sentAt: string;
}

type ViewMode = "recent" | "failed";

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("recent");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadNotifications();
  }, [viewMode]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint =
        viewMode === "recent"
          ? `${API_BASE_URL}/v1/api/notifications/recent`
          : `${API_BASE_URL}/v1/api/notifications/failed`;
      
      const response = await axios.get(endpoint);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      setError("Failed to load notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterSymbol && !n.symbol.toLowerCase().includes(filterSymbol.toLowerCase())) {
      return false;
    }
    if (filterStatus !== "all" && n.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <span style={{ color: "#38bdf8", fontWeight: 500 }}>✅ Success</span>;
      case "failed":
        return <span style={{ color: "#f87171", fontWeight: 500 }}>❌ Failed</span>;
      case "error":
        return <span style={{ color: "#fbbf24", fontWeight: 500 }}>⚠️ Error</span>;
      default:
        return <span style={{ color: "#94a3b8" }}>{status}</span>;
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="card">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>📊 Notification Monitoring</h1>
            <p className="muted">View and monitor push notification delivery logs</p>
          </div>
          <button type="button" onClick={loadNotifications}>
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div
            className="error-banner"
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "rgba(248, 113, 113, 0.1)",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#f87171", margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div className="filter-tabs">
            <button
              type="button"
              className={viewMode === "recent" ? "active" : ""}
              onClick={() => setViewMode("recent")}
            >
              Recent (100)
            </button>
            <button
              type="button"
              className={viewMode === "failed" ? "active" : ""}
              onClick={() => setViewMode("failed")}
            >
              Failed Only
            </button>
          </div>

          <input
            type="text"
            placeholder="Filter by symbol..."
            value={filterSymbol}
            onChange={(e) => setFilterSymbol(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: "150px" }}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="error">Error</option>
          </select>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No notifications found</h3>
            <p>No notification logs match your filters.</p>
          </div>
        ) : (
          <div className="alerts-table-container">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Threshold</th>
                  <th>Price</th>
                  <th>Direction</th>
                  <th>Status</th>
                  <th>Device</th>
                  <th>Timestamp</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--accent-color)" }}>
                        {notification.symbol}
                      </span>
                    </td>
                    <td>${notification.threshold.toFixed(2)}</td>
                    <td>${notification.price.toFixed(2)}</td>
                    <td>
                      <span
                        style={{
                          color:
                            notification.direction === "above" ? "#38bdf8" : "#fbbf24",
                        }}
                      >
                        {notification.direction === "above" ? "⬆️ Above" : "⬇️ Below"}
                      </span>
                    </td>
                    <td>{getStatusBadge(notification.status)}</td>
                    <td className="target-cell">
                      <span className="truncate" style={{ maxWidth: "120px" }}>
                        {notification.pushToken.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(notification.sentAt).toLocaleString()}
                    </td>
                    <td style={{ maxWidth: "200px" }}>
                      {notification.errorMessage ? (
                        <span
                          style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                          title={notification.errorMessage}
                        >
                          {notification.errorMessage.substring(0, 50)}
                          {notification.errorMessage.length > 50 ? "..." : ""}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

