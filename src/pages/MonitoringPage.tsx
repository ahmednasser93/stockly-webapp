import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAlerts } from "../hooks/useAlerts";
import { fetchStocks } from "../api/client";
import { AlertForm } from "../components/AlertForm";
import { DeleteAlertDialog } from "../components/DeleteAlertDialog";
import { axiosClient } from "../api/axios-client";
import type {
  Alert,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertStatus,
} from "../types";

type SortField = "symbol" | "threshold" | "status" | "createdAt";
type SortOrder = "asc" | "desc";
type AlertTab = "alerts" | "logs" | "devices" | "users";



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
  username?: string | null;
}

export function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<AlertTab>("alerts");
  const {
    alerts,
    isLoading,
    isError,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    refetch: refetchAlerts,
  } = useAlerts();

  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [usernameFilter, setUsernameFilter] = useState<string>("all");
  const [groupByUsername] = useState<boolean>(false); // TODO: Add UI control for this
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);


  // Notification logs state
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"recent" | "failed">("recent");
  const [logsFilterSymbol, setLogsFilterSymbol] = useState("");
  const [logsFilterStatus, setLogsFilterStatus] = useState<string>("all");
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [retryLogs, setRetryLogs] = useState<string[]>([]);
  const [retryResult, setRetryResult] = useState<{
    success: boolean;
    logId?: string;
    status?: string;
    errorMessage?: string | null;
  } | null>(null);

  // Devices state
  interface Device {
    username: string | null;
    pushToken: string;
    deviceInfo: string | null;
    deviceType: string | null;
    alertCount?: number;
    activeAlertCount?: number;
    createdAt: string;
    updatedAt: string;
  }
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [, setDeletingDeviceId] = useState<string | null>(null); // Used in handleDeleteDevice

  // Favorite Stocks state
  interface StockWithNews {
    symbol: string;
    hasNews: boolean;
  }
  interface UserFavoriteStocks {
    username: string;
    stocks: string[];
    stocksWithNews?: StockWithNews[];
    count: number;
  }
  const [favoriteStocks, setFavoriteStocks] = useState<UserFavoriteStocks[]>([]);
  const [favoriteStocksLoading, setFavoriteStocksLoading] = useState(false);
  const [favoriteStocksError, setFavoriteStocksError] = useState<string | null>(null);

  // Fetch current prices for all unique symbols
  const symbolsInAlerts = useMemo(
    () => Array.from(new Set(alerts.map((alert) => alert.symbol))),
    [alerts]
  );

  const pricesQuery = useQuery({
    queryKey: ["alertPrices", symbolsInAlerts],
    queryFn: () => fetchStocks(symbolsInAlerts),
    enabled: symbolsInAlerts.length > 0,
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  const priceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    pricesQuery.data?.forEach((quote) => {
      map.set(quote.symbol, quote.price);
    });
    return map;
  }, [pricesQuery.data]);

  // Note: Orphaned alerts detection removed - alerts are now associated with users, not specific devices
  // Notifications are sent to all devices for a user's username

  // Get unique usernames from alerts, notifications, devices, and favorite stocks
  const uniqueUsernames = useMemo(() => {
    const usernames = new Set<string>();
    alerts.forEach(a => a.username && usernames.add(a.username));
    notifications.forEach(n => n.username && usernames.add(n.username));
    devices.forEach(d => d.username && usernames.add(d.username));
    favoriteStocks.forEach(f => f.username && usernames.add(f.username));
    return Array.from(usernames).sort();
  }, [alerts, notifications, devices, favoriteStocks]);

  // Count devices without username (unregistered)
  const unregisteredDevicesCount = useMemo(() => {
    return devices.filter(d => !d.username).length;
  }, [devices]);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Filter by username
    if (usernameFilter !== "all") {
      filtered = filtered.filter((alert) => alert.username === usernameFilter);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((alert) => alert.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (alert) =>
          alert.symbol.toLowerCase().includes(query) ||
          alert.notes?.toLowerCase().includes(query) ||
          alert.username?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "symbol":
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case "threshold":
          aVal = a.threshold;
          bVal = b.threshold;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [alerts, filterStatus, searchQuery, sortField, sortOrder, usernameFilter]);

  // Helper function to render an alert row
  const renderAlertRow = (alert: Alert) => {
    const currentPrice = priceMap.get(alert.symbol);
    const distance = calculateDistance(alert);
    const isNearThreshold =
      currentPrice &&
      Math.abs(alert.threshold - currentPrice) / currentPrice <
      0.05;

    // Find devices for this alert's username (notifications go to all user devices)
    const userDevices = alert.username ? devices.filter((d) => d.username === alert.username) : [];

    return (
      <tr
        key={alert.id}
        className={alert.status === "paused" ? "paused" : ""}
      >
        {(groupByUsername || usernameFilter !== "all") && (
          <td>
            <span style={{ fontWeight: 600, color: "var(--accent-color)" }}>
              {alert.username || "Unknown"}
            </span>
          </td>
        )}
        <td className="symbol-cell">
          <strong>{alert.symbol}</strong>
        </td>
        <td>
          {currentPrice ? (
            <span className="price">
              ${currentPrice.toFixed(2)}
            </span>
          ) : (
            <span className="muted">�</span>
          )}
        </td>
        <td>
          <span
            className={`direction-badge ${alert.direction}`}
          >
            {alert.direction === "above" ? "↑ Above" : "↓ Below"}
          </span>
        </td>
        <td>
          <strong>${alert.threshold.toFixed(2)}</strong>
        </td>
        <td>
          {distance ? (
            <span
              className={`distance ${isNearThreshold ? "near" : ""}`}
            >
              {distance}
            </span>
          ) : (
            <span className="muted">�</span>
          )}
        </td>
        <td>
          <span className={`status-badge ${alert.status}`}>
            {alert.status === "active" ? "🟢 Active" : "⏸️ Paused"}
          </span>
        </td>
        <td>
          {alert.channel === "notification" ? (
            <span className="channel-badge">📱 Mobile Notification</span>
          ) : (
            <span className="legacy-badge">
              Legacy Alert (Disabled)
            </span>
          )}
        </td>
        <td className="target-cell">
          {alert.username ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: "600", color: "var(--accent-color)" }}>
                  @{alert.username}
                </span>
                {userDevices.length > 0 && (
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    ({userDevices.length} device{userDevices.length !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
              {userDevices.length === 0 && (
                <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontStyle: "italic" }}>
                  No devices registered
              </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              Unknown user
              </span>
          )}
        </td>
        <td>
          <span className="muted">
            {new Date(alert.createdAt).toLocaleDateString()}
          </span>
        </td>
        <td>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => {
                setEditingAlert(alert);
                setShowForm(true);
              }}
              className="btn-edit"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeletingAlert(alert)}
              className="btn-delete"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Helper function to render a device row
  const renderDeviceRow = (device: Device) => {
    // Find alerts for this device's user (alerts are now associated with username, not target)
    const deviceAlerts = device.username 
      ? alerts.filter(a => a.username === device.username)
      : [];
    const activeAlerts = deviceAlerts.filter(a => a.status === "active");

    // Parse deviceInfo if it's a JSON string
    let deviceDisplayName = device.deviceType || "unknown";
    if (device.deviceInfo) {
      try {
        const parsed = JSON.parse(device.deviceInfo);
        if (parsed.platform && parsed.model) {
          deviceDisplayName = `${parsed.platform} ${parsed.model}`;
        } else if (parsed.platform) {
          deviceDisplayName = parsed.platform;
        } else if (typeof device.deviceInfo === "string" && !device.deviceInfo.startsWith("{")) {
          deviceDisplayName = device.deviceInfo;
        }
      } catch {
        // If not JSON, use as-is
        if (typeof device.deviceInfo === "string") {
          deviceDisplayName = device.deviceInfo;
        }
      }
    }

    return (
      <tr 
        key={device.pushToken}
        style={!device.username ? {
          background: "rgba(245, 158, 11, 0.05)",
          borderLeft: "3px solid #f59e0b"
        } : {}}
      >
        <td>
          <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
            {deviceDisplayName}
          </span>
        </td>
        <td>
          {device.username ? (
          <span style={{ fontWeight: 600, color: "var(--accent-color)" }}>
              @{device.username}
          </span>
          ) : (
            <span style={{ 
              fontWeight: 600, 
              color: "#f59e0b",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem"
            }}>
              <span>??</span>
              <span>Unregistered</span>
            </span>
          )}
        </td>
        <td>
          <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
            {device.pushToken.substring(0, 40)}...
          </span>
        </td>
        <td>
          <span style={{ fontWeight: 500 }}>
            {activeAlerts.length} active / {deviceAlerts.length} total
          </span>
        </td>
        <td>
          <span className="muted">
            {device.updatedAt ? new Date(device.updatedAt).toLocaleDateString() : "�"}
          </span>
        </td>
        <td>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleSendTestNotification(device.pushToken)}
              disabled={testingDeviceId === device.pushToken}
              className="btn-edit"
              style={{ fontSize: "0.875rem", padding: "0.25rem 0.5rem" }}
            >
              {testingDeviceId === device.pushToken ? "Sending..." : "Test"}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteDevice(device.pushToken)}
              className="btn-delete"
              style={{ fontSize: "0.875rem", padding: "0.25rem 0.5rem" }}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleCreateAlert = async (
    data: CreateAlertRequest | UpdateAlertRequest
  ) => {
    try {
      await createAlert(data as CreateAlertRequest);
      setShowForm(false);
      showToast("Alert created successfully!", "success");
    } catch (err) {
      showToast(createError?.message || "Failed to create alert", "error");
      throw err;
    }
  };

  const handleUpdateAlert = async (
    data: CreateAlertRequest | UpdateAlertRequest
  ) => {
    if (!editingAlert) return;

    try {
      await updateAlert(editingAlert.id, data);
      setEditingAlert(null);
      showToast("Alert updated successfully!", "success");
    } catch (err) {
      showToast(updateError?.message || "Failed to update alert", "error");
      throw err;
    }
  };

  const handleDeleteAlert = async () => {
    if (!deletingAlert) return;

    try {
      await deleteAlert(deletingAlert.id);
      setDeletingAlert(null);
      showToast("Alert deleted successfully!", "success");
    } catch {
      showToast("Failed to delete alert", "error");
    }
  };

  // handleToggleStatus removed - alerts are managed through edit form

  const calculateDistance = (alert: Alert): string | null => {
    const currentPrice = priceMap.get(alert.symbol);
    if (!currentPrice) return null;

    const difference = alert.threshold - currentPrice;
    const percentage = (Math.abs(difference) / currentPrice) * 100;

    if (alert.direction === "above") {
      if (currentPrice >= alert.threshold) return "Triggered! ??";
      return `${percentage.toFixed(1)}% below`;
    } else {
      if (currentPrice <= alert.threshold) return "Triggered! ??";
      return `${percentage.toFixed(1)}% above`;
    }
  };


  // Load notification logs
  const loadNotifications = async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      const endpoint = viewMode === "recent"
        ? `/v1/api/notifications/recent`
        : `/v1/api/notifications/failed`;
      const response = await axiosClient.get(endpoint);
      setNotifications(response.data.notifications || []);
    } catch {
      setLogsError("Failed to load notifications");
    } finally {
      setLogsLoading(false);
    }
  };

  // Load devices
  const loadFavoriteStocks = async () => {
    setFavoriteStocksLoading(true);
    setFavoriteStocksError(null);
    try {
      const response = await axiosClient.get("/v1/api/favorite-stocks/all");
      if (response.data && response.data.users) {
        setFavoriteStocks(response.data.users);
      } else {
        setFavoriteStocksError("Invalid response format");
        setFavoriteStocks([]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load favorite stocks";
      setFavoriteStocksError(errorMessage);
      setFavoriteStocks([]);
      console.error("Failed to load favorite stocks:", err);
    } finally {
      setFavoriteStocksLoading(false);
    }
  };

  const loadDevices = async () => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const response = await axiosClient.get(`/v1/api/devices`);

      // Handle different response structures
      let devicesList: Device[] = [];

      if (response.data) {
        // Check if response.data is directly an array
        if (Array.isArray(response.data)) {
          devicesList = response.data;
        }
        // Check if response has devices property
        else if (response.data.devices && Array.isArray(response.data.devices)) {
          devicesList = response.data.devices;
        }
        // Check for paginated response (data.data)
        else if (response.data.data && Array.isArray(response.data.data)) {
          devicesList = response.data.data;
        }
        // Check for results array
        else if (response.data.results && Array.isArray(response.data.results)) {
          devicesList = response.data.results;
        }
        // Check for items array (common pagination pattern)
        else if (response.data.items && Array.isArray(response.data.items)) {
          devicesList = response.data.items;
        }
      }

      // Ensure we have an array
      setDevices(Array.isArray(devicesList) ? devicesList : []);

      // Log for debugging
      if (devicesList.length > 0) {
        console.log(`Loaded ${devicesList.length} device(s)`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load devices";
      setDevicesError(errorMessage);
      console.error("Failed to load devices:", err);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      setDevices([]); // Reset to empty array on error
    } finally {
      setDevicesLoading(false);
    }
  };

  // Send test notification to a specific device by pushToken
  const handleSendTestNotification = async (pushToken: string, customMessage?: string) => {
    setTestingDeviceId(pushToken);
    try {
      const response = await axiosClient.post(
        `/v1/api/devices/test`,
        { pushToken, ...(customMessage ? { message: customMessage } : {}) },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        showToast("Test notification sent successfully!", "success");
      } else {
        showToast(response.data.error || "Failed to send test notification", "error");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to send test notification";
      showToast(errorMessage, "error");
      console.error("Failed to send test notification:", err);
    } finally {
      setTestingDeviceId(null);
    }
  };

  // Delete device by pushToken
  const handleDeleteDevice = async (pushToken: string) => {
    if (!confirm(`Are you sure you want to delete this device? This will remove the push token and the device will need to re-register.`)) {
      return;
    }

    setDeletingDeviceId(pushToken);
    try {
      const response = await axiosClient.delete(
        `/v1/api/devices?pushToken=${encodeURIComponent(pushToken)}`
      );

      if (response.data.success) {
        showToast("Device deleted successfully!", "success");
        // Reload devices list
        await loadDevices();
      } else {
        showToast(response.data.error || "Failed to delete device", "error");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete device";
      showToast(errorMessage, "error");
      console.error("Failed to delete device:", err);
    } finally {
      setDeletingDeviceId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      loadNotifications();
    } else if (activeTab === "devices") {
      loadDevices();
    } else if (activeTab === "users") {
      loadFavoriteStocks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, viewMode]);

  // Retry notification
  const handleRetryNotification = async (logId: string) => {
    try {
      setRetryingLogId(logId);
      setRetryLogs([]);
      setRetryResult(null);

      const response = await axiosClient.post(`/v1/api/notifications/retry/${logId}`);
      const result = response.data;

      setRetryLogs(result.logs || []);
      setRetryResult({
        success: result.success,
        logId: result.logId,
        status: result.status,
        errorMessage: result.errorMessage,
      });

      // Reload notifications to show the new log entry
      await loadNotifications();

      showToast(
        result.success
          ? "Notification retried successfully!"
          : "Notification retry failed",
        result.success ? "success" : "error"
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to retry notification";
      setRetryLogs([`[${new Date().toISOString()}] ? Error: ${errorMessage}`]);
      setRetryResult({
        success: false,
        errorMessage,
      });
      showToast("Failed to retry notification", "error");
    } finally {
      setRetryingLogId(null);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (usernameFilter !== "all" && n.username !== usernameFilter) return false;
      if (logsFilterSymbol && !n.symbol.toLowerCase().includes(logsFilterSymbol.toLowerCase())) return false;
      if (logsFilterStatus !== "all" && n.status !== logsFilterStatus) return false;
      return true;
    });
  }, [notifications, usernameFilter, logsFilterSymbol, logsFilterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <span style={{ color: "#38bdf8", fontWeight: 500 }}>? Success</span>;
      case "failed":
        return <span style={{ color: "#f87171", fontWeight: 500 }}>? Failed</span>;
      case "error":
        return <span style={{ color: "#fbbf24", fontWeight: 500 }}>?? Error</span>;
      default:
        return <span style={{ color: "#94a3b8" }}>{status}</span>;
    }
  };

  return (
    <section className="page">
      <div className="card">
        <div className="alerts-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {activeTab === "alerts" && (
              <button type="button" onClick={() => setShowForm(true)}>
                + Create Alert
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {activeTab === "alerts" && (
              <button
                type="button"
                onClick={() => refetchAlerts()}
                disabled={isLoading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  background: "var(--ghost-border)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--ghost-border)",
                  borderRadius: "6px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isLoading ? "??" : "?"} Refresh
              </button>
            )}
            {activeTab === "users" && (
              <button
                type="button"
                onClick={() => loadFavoriteStocks()}
                disabled={favoriteStocksLoading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  background: "var(--ghost-border)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--ghost-border)",
                  borderRadius: "6px",
                  cursor: favoriteStocksLoading ? "not-allowed" : "pointer",
                  opacity: favoriteStocksLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {favoriteStocksLoading ? "??" : "?"} Refresh
              </button>
            )}
            {activeTab === "logs" && (
              <button
                type="button"
                onClick={() => loadNotifications()}
                disabled={logsLoading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  background: "var(--ghost-border)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--ghost-border)",
                  borderRadius: "6px",
                  cursor: logsLoading ? "not-allowed" : "pointer",
                  opacity: logsLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {logsLoading ? "??" : "?"} Refresh
              </button>
            )}
            {activeTab === "devices" && (
              <button
                type="button"
                onClick={() => loadDevices()}
                disabled={devicesLoading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  background: "var(--ghost-border)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--ghost-border)",
                  borderRadius: "6px",
                  cursor: devicesLoading ? "not-allowed" : "pointer",
                  opacity: devicesLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {devicesLoading ? "??" : "?"} Refresh
              </button>
            )}
            {activeTab === "users" && (
              <button
                type="button"
                onClick={() => loadFavoriteStocks()}
                disabled={favoriteStocksLoading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  background: "var(--ghost-border)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--ghost-border)",
                  borderRadius: "6px",
                  cursor: favoriteStocksLoading ? "not-allowed" : "pointer",
                  opacity: favoriteStocksLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {favoriteStocksLoading ? "??" : "?"} Refresh
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            className={activeTab === "alerts" ? "active" : ""}
            onClick={() => setActiveTab("alerts")}
          >
            Alerts Logs
          </button>
          <button
            type="button"
            className={activeTab === "logs" ? "active" : ""}
            onClick={() => setActiveTab("logs")}
          >
            Notification Logs
          </button>
          <button
            type="button"
            className={activeTab === "devices" ? "active" : ""}
            onClick={() => setActiveTab("devices")}
          >
            Devices
          </button>
          <button
            type="button"
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </div>

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <>
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading alerts...</p>
              </div>
            ) : isError ? (
              <div className="error-banner" style={{ padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                <p style={{ color: "#f87171", margin: 0 }}>? Error Loading Alerts: {error?.message || "Failed to load alerts"}</p>
              </div>
            ) : (
              <>
                <div className="alerts-controls">
                  <div className="search-wrapper">
                    <input
                      type="text"
                      placeholder="Search alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="alerts-search"
                    />
                  </div>

                  <div className="filter-tabs">
                    <button
                      type="button"
                      className={filterStatus === "all" ? "active" : ""}
                      onClick={() => setFilterStatus("all")}
                    >
                      All ({alerts.length})
                    </button>
                    <button
                      type="button"
                      className={filterStatus === "active" ? "active" : ""}
                      onClick={() => setFilterStatus("active")}
                    >
                      Active ({alerts.filter((a) => a.status === "active").length})
                    </button>
                    <button
                      type="button"
                      className={filterStatus === "paused" ? "active" : ""}
                      onClick={() => setFilterStatus("paused")}
                    >
                      Paused ({alerts.filter((a) => a.status === "paused").length})
                    </button>
                  </div>
                </div>

                {filteredAlerts.length === 0 ? (
                  <div className="empty-state">
                    {alerts.length === 0 ? (
                      <>
                        <div className="empty-icon">??</div>
                        <h3>No alerts configured</h3>
                        <p>Create your first alert to get started!</p>
                        <button type="button" onClick={() => setShowForm(true)}>
                          Create Alert
                        </button>
                      </>
                    ) : (
                      <>
                        <p>No alerts match your filters.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="alerts-table-container">
                    <table className="alerts-table">
                      <thead>
                        <tr>
                          {(groupByUsername || usernameFilter !== "all") && <th>Username</th>}
                          <th onClick={() => handleSort("symbol")}>
                            Symbol{" "}
                            {sortField === "symbol" && (sortOrder === "asc" ? "?" : "?")}
                          </th>
                          <th>Current Price</th>
                          <th>Direction</th>
                          <th onClick={() => handleSort("threshold")}>
                            Threshold{" "}
                            {sortField === "threshold" &&
                              (sortOrder === "asc" ? "?" : "?")}
                          </th>
                          <th>Distance</th>
                          <th onClick={() => handleSort("status")}>
                            Status{" "}
                            {sortField === "status" && (sortOrder === "asc" ? "?" : "?")}
                          </th>
                          <th>Channel</th>
                          <th>Device / Target</th>
                          <th onClick={() => handleSort("createdAt")}>
                            Created{" "}
                            {sortField === "createdAt" &&
                              (sortOrder === "asc" ? "?" : "?")}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(groupByUsername ? (() => {
                          const grouped = new Map<string, typeof filteredAlerts>();
                          filteredAlerts.forEach(alert => {
                            const username = alert.username || "Unknown";
                            if (!grouped.has(username)) {
                              grouped.set(username, []);
                            }
                            grouped.get(username)!.push(alert);
                          });
                          return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
                        })() : filteredAlerts.map(alert => [null, [alert]] as [string | null, typeof filteredAlerts])).flatMap(([username, alerts]: [string | null, typeof filteredAlerts]) => {
                          if (groupByUsername && username) {
                            return [
                              <tr key={`group-${username}`} style={{ background: "var(--surface-color)", fontWeight: 600 }}>
                                <td colSpan={10} style={{ padding: "0.75rem", borderBottom: "2px solid var(--accent-color)" }}>
                                  @{username} ({alerts.length} alert{alerts.length !== 1 ? "s" : ""})
                                </td>
                              </tr>,
                              ...alerts.map((alert) => {
                                return renderAlertRow(alert);
                              })
                            ];
                          }
                          return alerts.map((alert) => renderAlertRow(alert));
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Users Tab - shows favorite stocks per user */}
        {activeTab === "users" && (
          <div>
            {favoriteStocksLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading favorite stocks...</p>
              </div>
            ) : (
              <>
                {favoriteStocksError && (
                  <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                    <p style={{ color: "#f87171", margin: 0 }}>? {favoriteStocksError}</p>
                  </div>
                )}
                {favoriteStocks.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <h3>No favorite stocks found</h3>
                    <p>No users have selected favorite stocks yet.</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--ghost-border)" }}>
                        <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600 }}>Username</th>
                        <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600 }}>Favorite Stocks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {favoriteStocks.map((user) => {
                        // Create a map for quick lookup of which stocks have news
                        const stocksWithNewsMap = new Map<string, boolean>();
                        if (user.stocksWithNews) {
                          user.stocksWithNews.forEach(({ symbol, hasNews }) => {
                            stocksWithNewsMap.set(symbol.toUpperCase(), hasNews);
                          });
                        }

                        return (
                          <tr key={user.username} style={{ borderBottom: "1px solid var(--ghost-border)" }}>
                            <td style={{ padding: "0.75rem" }}>
                              <a
                                href={`/monitoring?username=${encodeURIComponent(user.username)}`}
                                style={{ color: "#3b82f6", textDecoration: "underline" }}
                              >
                                @{user.username}
                              </a>
                            </td>
                            <td style={{ padding: "0.75rem" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {user.stocks.map((symbol, idx) => {
                                  const hasNews = stocksWithNewsMap.get(symbol.toUpperCase()) || false;
                                  return (
                                    <span
                                      key={idx}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                        padding: "0.25rem 0.5rem",
                                        background: hasNews ? "rgba(56, 189, 248, 0.1)" : "var(--ghost-border)",
                                        borderRadius: "4px",
                                        fontSize: "0.875rem",
                                      }}
                                      title={hasNews ? `${symbol} has news` : `${symbol} - no news`}
                                    >
                                      {symbol}
                                      {hasNews && (
                                        <span
                                          style={{
                                            width: "6px",
                                            height: "6px",
                                            borderRadius: "50%",
                                            background: "#38bdf8",
                                          }}
                                          title="Has news"
                                        />
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}

        {/* Notification Logs Tab */}
        {activeTab === "logs" && (
          <div>
            {logsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : (
              <>
                {logsError && (
                  <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                    <p style={{ color: "#f87171", margin: 0 }}>? {logsError}</p>
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
                    value={logsFilterSymbol}
                    onChange={(e) => setLogsFilterSymbol(e.target.value)}
                    style={{ flex: 1, minWidth: "200px", padding: "0.5rem", fontSize: "0.875rem", border: "1px solid var(--ghost-border)", borderRadius: "6px" }}
                  />
                  <select
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    style={{ padding: "0.5rem", fontSize: "0.875rem", border: "1px solid var(--ghost-border)", borderRadius: "6px" }}
                  >
                    <option value="all">All Users</option>
                    {uniqueUsernames.map((username) => (
                      <option key={username} value={username}>
                        {username}
                      </option>
                    ))}
                  </select>
                  <select
                    value={logsFilterStatus}
                    onChange={(e) => setLogsFilterStatus(e.target.value)}
                    style={{ padding: "0.5rem", fontSize: "0.875rem", border: "1px solid var(--ghost-border)", borderRadius: "6px" }}
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                {filteredNotifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">??</div>
                    <h3>No notifications found</h3>
                    <p>No notification logs match your filters.</p>
                  </div>
                ) : (
                  <>
                    <div className="alerts-table-container">
                      <table className="alerts-table">
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th>Threshold</th>
                            <th>Price</th>
                            <th>Direction</th>
                            <th>Status</th>
                            <th>Username</th>
                            <th>Device</th>
                            <th>Timestamp</th>
                            <th>Error</th>
                            {viewMode === "failed" && <th>Actions</th>}
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
                                    color: notification.direction === "above" ? "#38bdf8" : "#fbbf24",
                                  }}
                                >
                                  {notification.direction === "above" ? "↑ Above" : "↓ Below"}
                                </span>
                              </td>
                              <td>{getStatusBadge(notification.status)}</td>
                              <td>
                                <span style={{ 
                                  fontWeight: notification.username ? 500 : 400,
                                  color: notification.username ? "var(--text-primary)" : "var(--text-muted)"
                                }}>
                                  {notification.username || "�"}
                                </span>
                              </td>
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
                                  <span style={{ color: "var(--text-muted)" }}>�</span>
                                )}
                              </td>
                              {viewMode === "failed" && (
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => handleRetryNotification(notification.id)}
                                    disabled={retryingLogId === notification.id}
                                    style={{
                                      padding: "0.5rem 1rem",
                                      fontSize: "0.875rem",
                                      background: retryingLogId === notification.id
                                        ? "var(--ghost-border)"
                                        : "var(--accent-color)",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: retryingLogId === notification.id ? "not-allowed" : "pointer",
                                      opacity: retryingLogId === notification.id ? 0.6 : 1,
                                    }}
                                  >
                                    {retryingLogId === notification.id ? "Retrying..." : "?? Retry"}
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Retry Logs Display */}
                    {(retryLogs.length > 0 || retryResult) && (
                      <div style={{
                        marginTop: "2rem",
                        padding: "1.5rem",
                        background: "var(--card-bg)",
                        border: "1px solid var(--ghost-border)",
                        borderRadius: "8px",
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1rem",
                        }}>
                          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                            Retry Logs
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setRetryLogs([]);
                              setRetryResult(null);
                            }}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.875rem",
                              background: "transparent",
                              border: "1px solid var(--ghost-border)",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                        </div>

                        {retryResult && (
                          <div style={{
                            marginBottom: "1rem",
                            padding: "1rem",
                            background: retryResult.success
                              ? "rgba(56, 189, 248, 0.1)"
                              : "rgba(248, 113, 113, 0.1)",
                            border: `1px solid ${retryResult.success
                              ? "rgba(56, 189, 248, 0.3)"
                              : "rgba(248, 113, 113, 0.3)"}`,
                            borderRadius: "6px",
                          }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.5rem",
                            }}>
                              <span style={{ fontSize: "1.25rem" }}>
                                {retryResult.success ? "?" : "?"}
                              </span>
                              <strong style={{
                                color: retryResult.success ? "#38bdf8" : "#f87171",
                              }}>
                                {retryResult.success ? "Retry Successful" : "Retry Failed"}
                              </strong>
                            </div>
                            {retryResult.logId && (
                              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                                Log ID: {retryResult.logId}
                              </p>
                            )}
                            {retryResult.errorMessage && (
                              <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#f87171" }}>
                                Error: {retryResult.errorMessage}
                              </p>
                            )}
                          </div>
                        )}

                        <div style={{
                          maxHeight: "300px",
                          overflowY: "auto",
                          padding: "1rem",
                          background: "var(--bg)",
                          border: "1px solid var(--ghost-border)",
                          borderRadius: "6px",
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          lineHeight: "1.6",
                        }}>
                          {retryLogs.length === 0 ? (
                            <span style={{ color: "var(--text-muted)" }}>No logs available</span>
                          ) : (
                            retryLogs.map((log, index) => (
                              <div key={index} style={{
                                marginBottom: "0.5rem",
                                color: log.includes("?")
                                  ? "#38bdf8"
                                  : log.includes("?")
                                    ? "#f87171"
                                    : "var(--text)",
                              }}>
                                {log}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === "devices" && (
          <div>
            {devicesLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading devices...</p>
              </div>
            ) : (
              <>
                {devicesError && (
                  <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                    <p style={{ color: "#f87171", margin: 0 }}>? {devicesError}</p>
                  </div>
                )}
                {unregisteredDevicesCount > 0 && (
                  <div style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "8px"
                  }}>
                    <p style={{ margin: 0, color: "#f59e0b", fontWeight: "600", marginBottom: "0.5rem" }}>
                      ?? Info: {unregisteredDevicesCount} unregistered device{unregisteredDevicesCount !== 1 ? "s" : ""} found
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      These devices have push tokens but are not associated with any user account. They are shown with "?? Unregistered" in the Username column below.
                    </p>
                  </div>
                )}
                {devices.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">??</div>
                    <h3>No devices registered</h3>
                    <p>No devices have registered their push tokens yet.</p>
                  </div>
                ) : (
                  <div className="alerts-table-container">
                    <table className="alerts-table">
                      <thead>
                        <tr>
                          <th>Device Type</th>
                          <th>Username</th>
                          <th>Push Token</th>
                          <th>Alerts</th>
                          <th>Last Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(groupByUsername ? (() => {
                          const grouped = new Map<string, typeof devices>();
                          const filtered = usernameFilter !== "all" 
                            ? devices.filter(d => d.username === usernameFilter)
                            : devices;
                          filtered.forEach(device => {
                            const username = device.username || "Unknown";
                            if (!grouped.has(username)) {
                              grouped.set(username, []);
                            }
                            grouped.get(username)!.push(device);
                          });
                          return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
                        })() : (usernameFilter !== "all" 
                          ? devices.filter(d => d.username === usernameFilter).map(device => [null, [device]] as [string | null, typeof devices])
                          : devices.map(device => [null, [device]] as [string | null, typeof devices]))).flatMap(([username, deviceList]: [string | null, typeof devices]) => {
                          if (groupByUsername && username) {
                            return [
                              <tr key={`group-${username}`} style={{ background: "var(--surface-color)", fontWeight: 600 }}>
                                <td colSpan={6} style={{ padding: "0.75rem", borderBottom: "2px solid var(--accent-color)" }}>
                                  @{username} ({deviceList.length} device{deviceList.length !== 1 ? "s" : ""})
                                </td>
                              </tr>,
                              ...deviceList.map((device) => {
                                return renderDeviceRow(device);
                              })
                            ];
                          }
                          return deviceList.map((device) => renderDeviceRow(device));
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Users Tab - shows favorite stocks per user */}
        {activeTab === "users" && (
          <div>
            {favoriteStocksLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading favorite stocks...</p>
              </div>
            ) : (
              <>
                {favoriteStocksError && (
                  <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                    <p style={{ color: "#f87171", margin: 0 }}>? {favoriteStocksError}</p>
                  </div>
                )}
                {favoriteStocks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">??</div>
                    <h3>No favorite stocks found</h3>
                    <p>No users have selected favorite stocks yet.</p>
                  </div>
                ) : (
                  <div className="alerts-table-container">
                    <table className="alerts-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Favorite Stocks</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {favoriteStocks.map((user) => {
                          // Create a map for quick lookup of which stocks have news
                          const stocksWithNewsMap = new Map<string, boolean>();
                          if (user.stocksWithNews) {
                            user.stocksWithNews.forEach(({ symbol, hasNews }) => {
                              stocksWithNewsMap.set(symbol.toUpperCase(), hasNews);
                            });
                          }

                          return (
                            <tr key={user.username}>
                              <td>
                                <strong>{user.username}</strong>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                  {user.stocks.length > 0 ? (
                                    user.stocks.map((symbol, idx) => {
                                      const hasNews = stocksWithNewsMap.get(symbol.toUpperCase()) || false;
                                      return (
                                        <span
                                          key={idx}
                                          style={{
                                            padding: "0.25rem 0.5rem",
                                            background: hasNews 
                                              ? "rgba(59, 130, 246, 0.15)" 
                                              : "rgba(34, 197, 94, 0.1)",
                                            border: hasNews
                                              ? "1px solid rgba(59, 130, 246, 0.4)"
                                              : "1px solid rgba(34, 197, 94, 0.3)",
                                            borderRadius: "4px",
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: hasNews ? "#3b82f6" : "#22c55e",
                                            position: "relative",
                                          }}
                                          title={hasNews ? `${symbol} has news` : `${symbol} - no news`}
                                        >
                                          {symbol}
                                          {hasNews && (
                                            <span
                                              style={{
                                                marginLeft: "0.25rem",
                                                fontSize: "0.75rem",
                                              }}
                                              title="Has news"
                                            >
                                              ??
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                                      No stocks
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  padding: "0.25rem 0.5rem",
                                  background: "rgba(168, 85, 247, 0.1)",
                                  color: "#a855f7",
                                  borderRadius: "4px",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                }}>
                                  {user.count}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {showForm && (
          <AlertForm
            onSubmit={handleCreateAlert}
            onCancel={() => setShowForm(false)}
            isSubmitting={isCreating}
          />
        )}

        {editingAlert && (
          <AlertForm
            alert={editingAlert}
            onSubmit={handleUpdateAlert}
            onCancel={() => setEditingAlert(null)}
            isSubmitting={isUpdating}
          />
        )}

        {deletingAlert && (
          <DeleteAlertDialog
            alert={deletingAlert}
            onConfirm={handleDeleteAlert}
            onCancel={() => setDeletingAlert(null)}
            isDeleting={isDeleting}
          />
        )}

        {toast && (
          <div className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToast(null)}
            >
              ?
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

