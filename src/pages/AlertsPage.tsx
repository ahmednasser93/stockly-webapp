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
type AlertTab = "alerts" | "preferences" | "logs" | "devices" | "favoriteStocks";


interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  quietStart?: string | null;
  quietEnd?: string | null;
  allowedSymbols?: string[] | null;
  maxDaily?: number | null;
  updatedAt: string;
}

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

export function AlertsPage() {
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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Preferences state
  // userId is now from authenticated user
  const [, setPreferences] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSuccess, setPrefsSuccess] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [maxDaily, setMaxDaily] = useState("");
  const [allowedSymbols, setAllowedSymbols] = useState("");

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
    username?: string | null;
    userId: string;
    pushToken: string;
    deviceInfo: string | null;
    alertCount?: number;
    activeAlertCount?: number;
    createdAt: string;
    updatedAt: string;
  }
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);

  // Favorite Stocks state
  interface StockWithNews {
    symbol: string;
    hasNews: boolean;
  }
  interface UserFavoriteStocks {
    userId: string;
    username: string | null;
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

  // Detect orphaned alerts (alerts with push tokens that don't match any device)
  const orphanedAlerts = useMemo(() => {
    return alerts.filter((alert) => !devices.some((d) => d.pushToken === alert.target));
  }, [alerts, devices]);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

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
          alert.target.toLowerCase().includes(query) ||
          alert.notes?.toLowerCase().includes(query)
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
  }, [alerts, filterStatus, searchQuery, sortField, sortOrder]);

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

  const handleToggleStatus = async (alert: Alert) => {
    const newStatus: AlertStatus =
      alert.status === "active" ? "paused" : "active";
    try {
      await updateAlert(alert.id, { status: newStatus });
      showToast(
        `Alert ${newStatus === "active" ? "activated" : "paused"}!`,
        "success"
      );
    } catch {
      showToast("Failed to update alert status", "error");
    }
  };

  const calculateDistance = (alert: Alert): string | null => {
    const currentPrice = priceMap.get(alert.symbol);
    if (!currentPrice) return null;

    const difference = alert.threshold - currentPrice;
    const percentage = (Math.abs(difference) / currentPrice) * 100;

    if (alert.direction === "above") {
      if (currentPrice >= alert.threshold) return "Triggered! 🎯";
      return `${percentage.toFixed(1)}% below`;
    } else {
      if (currentPrice <= alert.threshold) return "Triggered! 🎯";
      return `${percentage.toFixed(1)}% above`;
    }
  };

  // Load preferences
  const loadPreferences = async () => {
    try {
      setPrefsLoading(true);
      setPrefsError(null);
      const response = await axiosClient.get(`/v1/api/preferences`);
      const prefs = response.data as NotificationPreferences;
      setPreferences(prefs);
      setEnabled(prefs.enabled);
      setQuietStart(prefs.quietStart || "");
      setQuietEnd(prefs.quietEnd || "");
      setMaxDaily(prefs.maxDaily ? String(prefs.maxDaily) : "");
      setAllowedSymbols(prefs.allowedSymbols ? prefs.allowedSymbols.join(", ") : "");
    } catch (err: unknown) {
      const error = err as { code?: string; response?: { status?: number; data?: { error?: string } }; message?: string };
      if (error?.code === "ERR_NETWORK" || error?.response?.status && error.response.status >= 500) {
        setPrefsError(`Failed to load preferences: ${error?.response?.data?.error || error?.message || "Unknown error"}`);
      } else {
        setPrefsError(null);
      }
    } finally {
      setPrefsLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsSaving(true);
    setPrefsError(null);
    setPrefsSuccess(null);
    try {
      const symbolsArray = allowedSymbols
        ? allowedSymbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
        : null;
      await axiosClient.put(`/v1/api/preferences`, {
        // userId is automatically extracted from JWT in cookie
        enabled,
        quietStart: quietStart || null,
        quietEnd: quietEnd || null,
        maxDaily: maxDaily ? parseInt(maxDaily, 10) : null,
        allowedSymbols: symbolsArray,
      });
      setPrefsSuccess("Preferences saved successfully!");
      await loadPreferences();
    } catch {
      setPrefsError("Failed to save preferences");
    } finally {
      setPrefsSaving(false);
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
    if (activeTab === "preferences") {
      loadPreferences();
    } else if (activeTab === "logs") {
      loadNotifications();
    } else if (activeTab === "devices") {
      loadDevices();
    } else if (activeTab === "favoriteStocks") {
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
      setRetryLogs([`[${new Date().toISOString()}] ❌ Error: ${errorMessage}`]);
      setRetryResult({
        success: false,
        errorMessage,
      });
      showToast("Failed to retry notification", "error");
    } finally {
      setRetryingLogId(null);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (logsFilterSymbol && !n.symbol.toLowerCase().includes(logsFilterSymbol.toLowerCase())) return false;
    if (logsFilterStatus !== "all" && n.status !== logsFilterStatus) return false;
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
                {isLoading ? "🔄" : "↻"} Refresh
              </button>
            )}
            {activeTab === "preferences" && (
              <button
                type="button"
                onClick={() => loadPreferences()}
                disabled={prefsLoading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  background: "var(--ghost-border)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--ghost-border)",
                  borderRadius: "6px",
                  cursor: prefsLoading ? "not-allowed" : "pointer",
                  opacity: prefsLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {prefsLoading ? "🔄" : "↻"} Refresh
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
                {logsLoading ? "🔄" : "↻"} Refresh
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
                {devicesLoading ? "🔄" : "↻"} Refresh
              </button>
            )}
            {activeTab === "favoriteStocks" && (
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
                {favoriteStocksLoading ? "🔄" : "↻"} Refresh
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
            className={activeTab === "preferences" ? "active" : ""}
            onClick={() => setActiveTab("preferences")}
          >
            Push Notifications Preferences
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
            className={activeTab === "favoriteStocks" ? "active" : ""}
            onClick={() => setActiveTab("favoriteStocks")}
          >
            Favorite Stock
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
                <p style={{ color: "#f87171", margin: 0 }}>❌ Error Loading Alerts: {error?.message || "Failed to load alerts"}</p>
              </div>
            ) : (
              <>
                {orphanedAlerts.length > 0 && (
                  <div style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px"
                  }}>
                    <p style={{ margin: 0, color: "#ef4444", fontWeight: "600", marginBottom: "0.5rem" }}>
                      ⚠️ Warning: {orphanedAlerts.length} orphaned alert{orphanedAlerts.length !== 1 ? "s" : ""} detected
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      These alerts have push tokens that don't match any registered device. They will not receive notifications until the device is registered or the alert is updated with a valid token. Orphaned alerts are highlighted in red in the table below.
                    </p>
                  </div>
                )}
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
                        <div className="empty-icon">🔔</div>
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
                          <th onClick={() => handleSort("symbol")}>
                            Symbol{" "}
                            {sortField === "symbol" && (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          <th>Current Price</th>
                          <th>Direction</th>
                          <th onClick={() => handleSort("threshold")}>
                            Threshold{" "}
                            {sortField === "threshold" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          <th>Distance</th>
                          <th onClick={() => handleSort("status")}>
                            Status{" "}
                            {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          <th>Channel</th>
                          <th>Device / Target</th>
                          <th onClick={() => handleSort("createdAt")}>
                            Created{" "}
                            {sortField === "createdAt" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAlerts.map((alert) => {
                          const currentPrice = priceMap.get(alert.symbol);
                          const distance = calculateDistance(alert);
                          const isNearThreshold =
                            currentPrice &&
                            Math.abs(alert.threshold - currentPrice) / currentPrice <
                            0.05;

                          // Find matching device for this alert
                          const matchingDevice = devices.find((d) => d.pushToken === alert.target);
                          const isOrphaned = !matchingDevice;

                          return (
                            <tr
                              key={alert.id}
                              className={alert.status === "paused" ? "paused" : isOrphaned ? "orphaned" : ""}
                              style={isOrphaned ? {
                                background: "rgba(239, 68, 68, 0.05)",
                                borderLeft: "3px solid #ef4444"
                              } : {}}
                            >
                              <td className="symbol-cell">
                                <strong>{alert.symbol}</strong>
                              </td>
                              <td>
                                {currentPrice ? (
                                  <span className="price">
                                    ${currentPrice.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="muted">—</span>
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
                                  <span className="muted">—</span>
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
                                {matchingDevice ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                      <span style={{ fontWeight: "600", color: "var(--accent-color)" }}>
                                        {matchingDevice.userId}
                                      </span>
                                      {matchingDevice.deviceInfo && (
                                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                                          ({matchingDevice.deviceInfo})
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                      {alert.target.substring(0, 30)}...
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                      <span style={{ color: "#ef4444", fontWeight: "600" }}>⚠️ Orphaned</span>
                                    </div>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                      {alert.target.substring(0, 30)}...
                                    </span>
                                    <span style={{ fontSize: "0.75rem", color: "#ef4444", fontStyle: "italic" }}>
                                      No matching device found
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="date-cell">
                                {new Date(alert.createdAt).toLocaleDateString()}
                              </td>
                              <td className="actions-cell">
                                {alert.channel === "notification" ? (
                                  <>
                                    <button
                                      type="button"
                                      className="icon-button"
                                      onClick={() => handleToggleStatus(alert)}
                                      title={
                                        alert.status === "active" ? "Pause" : "Activate"
                                      }
                                      disabled={isUpdating}
                                    >
                                      {alert.status === "active" ? "⏸️" : "▶️"}
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-button"
                                      onClick={() => setEditingAlert(alert)}
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="icon-button"
                                    disabled={true}
                                    title="Legacy alerts cannot be edited"
                                    style={{ opacity: 0.4, cursor: "not-allowed" }}
                                  >
                                    ✏️
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="icon-button danger"
                                  onClick={() => setDeletingAlert(alert)}
                                  title="Delete"
                                >
                                  🗑️
                                </button>
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
          </>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div>
            {prefsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading preferences...</p>
              </div>
            ) : (
              <>
                {prefsError && (
                  <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                    <p style={{ color: "#f87171", margin: 0 }}>❌ {prefsError}</p>
                  </div>
                )}
                {prefsSuccess && (
                  <div className="success-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "8px" }}>
                    <p style={{ color: "#38bdf8", margin: 0 }}>✅ {prefsSuccess}</p>
                  </div>
                )}
                <form onSubmit={savePreferences} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="form-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        style={{ width: "18px", height: "18px" }}
                      />
                      <span style={{ fontWeight: 500 }}>Enable Push Notifications</span>
                    </label>
                    <p className="help-text" style={{ marginTop: "0.5rem", marginLeft: "26px" }}>
                      When disabled, no notifications will be sent
                    </p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="quietStart">Quiet Hours Start</label>
                    <input
                      id="quietStart"
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      placeholder="22:00"
                      disabled={!enabled}
                    />
                    <p className="help-text">No notifications will be sent during quiet hours</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="quietEnd">Quiet Hours End</label>
                    <input
                      id="quietEnd"
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      placeholder="08:00"
                      disabled={!enabled}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="maxDaily">Max Notifications Per Day</label>
                    <input
                      id="maxDaily"
                      type="number"
                      min="1"
                      max="100"
                      value={maxDaily}
                      onChange={(e) => setMaxDaily(e.target.value)}
                      placeholder="10"
                      disabled={!enabled}
                    />
                    <p className="help-text">Limit the number of daily notifications</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="allowedSymbols">Allowed Symbols (comma-separated)</label>
                    <input
                      id="allowedSymbols"
                      type="text"
                      value={allowedSymbols}
                      onChange={(e) => setAllowedSymbols(e.target.value)}
                      placeholder="AAPL, MSFT, GOOGL"
                      disabled={!enabled}
                    />
                    <p className="help-text">
                      Only receive notifications for these symbols. Leave empty for all symbols.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={loadPreferences}
                      disabled={prefsSaving}
                      style={{ background: "transparent", border: "1px solid var(--ghost-border)" }}
                    >
                      Reset
                    </button>
                    <button type="submit" disabled={prefsSaving}>
                      {prefsSaving ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </form>
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
                    <p style={{ color: "#f87171", margin: 0 }}>❌ {logsError}</p>
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
                    style={{ flex: 1, minWidth: "200px" }}
                  />
                  <select
                    value={logsFilterStatus}
                    onChange={(e) => setLogsFilterStatus(e.target.value)}
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
                                    {retryingLogId === notification.id ? "Retrying..." : "🔄 Retry"}
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
                                {retryResult.success ? "✅" : "❌"}
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
                                color: log.includes("✅")
                                  ? "#38bdf8"
                                  : log.includes("❌")
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
                    <p style={{ color: "#f87171", margin: 0 }}>❌ {devicesError}</p>
                  </div>
                )}
                {orphanedAlerts.length > 0 && (
                  <div style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px"
                  }}>
                    <p style={{ margin: 0, color: "#ef4444", fontWeight: "600", marginBottom: "0.5rem" }}>
                      ⚠️ Warning: {orphanedAlerts.length} orphaned alert{orphanedAlerts.length !== 1 ? "s" : ""} detected
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      These alerts have push tokens that don't match any registered device. They will not receive notifications until the device is registered or the alert is updated with a valid token.
                    </p>
                  </div>
                )}
                {devices.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📱</div>
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
                          <th>User ID</th>
                          <th>Alerts</th>
                          <th>Last Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.map((device) => {
                          // Count alerts for this device
                          const deviceAlerts = alerts.filter((a) => a.target === device.pushToken);
                          const activeAlerts = deviceAlerts.filter((a) => a.status === "active");
                          const displayAlertCount = device.alertCount !== undefined ? device.alertCount : deviceAlerts.length;
                          const displayActiveCount = device.activeAlertCount !== undefined ? device.activeAlertCount : activeAlerts.length;

                          // Parse device info to extract device type
                          let deviceType = "Unknown";
                          if (device.deviceInfo) {
                            try {
                              const deviceInfo = typeof device.deviceInfo === "string" 
                                ? JSON.parse(device.deviceInfo) 
                                : device.deviceInfo;
                              if (deviceInfo.platform) {
                                deviceType = `${deviceInfo.platform}${deviceInfo.model ? ` ${deviceInfo.model}` : ""}`;
                              } else if (typeof device.deviceInfo === "string") {
                                deviceType = device.deviceInfo;
                              }
                            } catch {
                              // If parsing fails, use the raw string
                              deviceType = device.deviceInfo || "Unknown";
                            }
                          }

                          return (
                            <tr key={device.userId}>
                              <td>
                                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                  {deviceType}
                                </span>
                              </td>
                              <td>
                                {device.username ? (
                                  <span style={{ fontWeight: 600, color: "var(--accent-color)" }}>
                                    @{device.username}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                    No username
                                  </span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                  {device.userId.substring(0, 20)}...
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                  <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                                    {displayAlertCount} total
                                  </span>
                                  <span style={{ fontSize: "0.8125rem", color: displayActiveCount > 0 ? "#22c55e" : "var(--text-muted)" }}>
                                    {displayActiveCount} active
                                  </span>
                                </div>
                              </td>
                              <td className="date-cell">
                                {new Date(device.updatedAt).toLocaleString()}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleSendTestNotification(device.pushToken)}
                                    disabled={testingDeviceId === device.pushToken || deletingDeviceId === device.pushToken}
                                    style={{
                                      padding: "0.5rem 1rem",
                                      fontSize: "0.875rem",
                                      background: testingDeviceId === device.pushToken ? "var(--ghost-border)" : "var(--accent-color)",
                                      color: testingDeviceId === device.pushToken ? "var(--text-muted)" : "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: testingDeviceId === device.pushToken ? "not-allowed" : "pointer",
                                      opacity: testingDeviceId === device.pushToken || deletingDeviceId === device.pushToken ? 0.6 : 1,
                                    }}
                                  >
                                    {testingDeviceId === device.pushToken ? "Sending..." : "Test"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDevice(device.pushToken)}
                                    disabled={deletingDeviceId === device.pushToken || testingDeviceId === device.pushToken}
                                    style={{
                                      padding: "0.5rem 1rem",
                                      fontSize: "0.875rem",
                                      background: deletingDeviceId === device.pushToken ? "var(--ghost-border)" : "#dc2626",
                                      color: deletingDeviceId === device.pushToken ? "var(--text-muted)" : "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: deletingDeviceId === device.pushToken ? "not-allowed" : "pointer",
                                      opacity: deletingDeviceId === device.pushToken || testingDeviceId === device.pushToken ? 0.6 : 1,
                                    }}
                                  >
                                    {deletingDeviceId === device.pushToken ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
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

        {/* Favorite Stocks Tab */}
        {activeTab === "favoriteStocks" && (
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
                    <p style={{ color: "#f87171", margin: 0 }}>❌ {favoriteStocksError}</p>
                  </div>
                )}
                {favoriteStocks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
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
                            <tr key={user.userId}>
                              <td>
                                <strong>{user.username || user.userId}</strong>
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
                                              📰
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
            devices={devices}
          />
        )}

        {editingAlert && (
          <AlertForm
            alert={editingAlert}
            onSubmit={handleUpdateAlert}
            onCancel={() => setEditingAlert(null)}
            isSubmitting={isUpdating}
            devices={devices}
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
              ✕
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

