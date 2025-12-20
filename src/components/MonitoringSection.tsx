import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAlerts } from "../hooks/useAlerts";
import { fetchStocks } from "../api/client";
import { AlertForm } from "./AlertForm";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { UserCard, type UserCardData } from "./UserCard";
import { useNavigate } from "react-router-dom";
import { axiosClient } from "../api/axios-client";
import type {
  Alert,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertStatus,
} from "../types";

type SortField = "symbol" | "threshold" | "status" | "createdAt";
type SortOrder = "asc" | "desc";
type MonitoringTab = "alerts" | "logs" | "devices" | "users";

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

interface UserWithActivity {
  userId: string;
  username: string | null;
  hasFavoriteStocks: boolean;
  favoriteStocksCount: number;
  favoriteStocks: string[]; // Actual stock symbols
  hasDevices: boolean;
  devicesCount: number;
  hasAlerts: boolean;
  alertsCount: number;
  activeAlertsCount: number;
}


export function MonitoringSection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MonitoringTab>("users");
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
  const [groupByUsername, setGroupByUsername] = useState<boolean>(false);
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);

  // Users state
  const [allUsers, setAllUsers] = useState<UserWithActivity[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // User detail dialog state

  // Fetch current prices for all unique symbols
  const symbolsInAlerts = useMemo(
    () => Array.from(new Set(alerts.map((alert) => alert.symbol))),
    [alerts]
  );

  const pricesQuery = useQuery({
    queryKey: ["alertPrices", symbolsInAlerts],
    queryFn: () => fetchStocks(symbolsInAlerts),
    enabled: symbolsInAlerts.length > 0,
    refetchInterval: 60 * 1000,
  });

  const priceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    pricesQuery.data?.forEach((quote) => {
      map.set(quote.symbol, quote.price);
    });
    return map;
  }, [pricesQuery.data]);

  // Get unique usernames
  const uniqueUsernames = useMemo(() => {
    const usernames = new Set<string>();
    alerts.forEach(a => a.username && usernames.add(a.username));
    notifications.forEach(n => n.username && usernames.add(n.username));
    devices.forEach(d => d.username && usernames.add(d.username));
    allUsers.forEach(u => u.username && usernames.add(u.username));
    return Array.from(usernames).sort();
  }, [alerts, notifications, devices, allUsers]);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    if (usernameFilter !== "all") {
      filtered = filtered.filter((alert) => alert.username === usernameFilter);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((alert) => alert.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (alert) =>
          alert.symbol.toLowerCase().includes(query) ||
          alert.notes?.toLowerCase().includes(query) ||
          alert.username?.toLowerCase().includes(query)
      );
    }

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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (usernameFilter !== "all" && n.username !== usernameFilter) return false;
      if (logsFilterSymbol && !n.symbol.toLowerCase().includes(logsFilterSymbol.toLowerCase())) return false;
      if (logsFilterStatus !== "all" && n.status !== logsFilterStatus) return false;
      return true;
    });
  }, [notifications, usernameFilter, logsFilterSymbol, logsFilterStatus]);

  // Prepare user cards data - use allUsers from API (includes ALL users, even with no activity)
  const userCardsData = useMemo<UserCardData[]>(() => {
    // Create user cards for all users from the API
    // allUsers already includes favoriteStocks array for each user
    return allUsers.map((user) => {
      const username = user.username || user.userId;
      
      // Get alerts for this user (use real-time count from alerts state if available, otherwise use API count)
      const userAlerts = alerts.filter(a => a.username === username);
      const alertCount = userAlerts.length > 0 ? userAlerts.length : user.alertsCount;
      
      // Get devices for this user (use real-time count from devices state if available, otherwise use API count)
      const userDevices = devices.filter(d => d.username === username);
      const deviceCount = userDevices.length > 0 ? userDevices.length : user.devicesCount;
      
      // Get favorite stocks symbols for this user (already included in allUsers response)
      const stocks = user.favoriteStocks || [];
      
      return {
        username,
        email: undefined, // Email not available in current API
        stocks: stocks,
        alerts: alertCount,
        devices: deviceCount,
      };
    }).sort((a, b) => a.username.localeCompare(b.username)); // Sort alphabetically
  }, [allUsers, alerts, devices]);

  // Load functions
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

  const loadAllUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await axiosClient.get("/v1/api/users/all");
      if (response.data && response.data.users) {
        const users = response.data.users;
        console.log(`Loaded ${users.length} user(s) from API`, {
          total: users.length,
          users: users.map((u: UserWithActivity) => ({ 
            username: u.username, 
            favoriteStocksCount: u.favoriteStocksCount,
            devicesCount: u.devicesCount,
            alertsCount: u.alertsCount,
          })),
        });
        setAllUsers(users);
      } else {
        setUsersError("Invalid response format");
        setAllUsers([]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load users";
      setUsersError(errorMessage);
      setAllUsers([]);
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };


  const loadDevices = async () => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const response = await axiosClient.get(`/v1/api/devices`);

      let apiDevices: Array<{
        pushTokens?: string[];
        username?: string | null;
        deviceInfo?: string | null;
        deviceType?: string | null;
        alertCount?: number;
        activeAlertCount?: number;
        createdAt?: string;
        updatedAt?: string;
      }> = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          apiDevices = response.data;
        } else if (response.data.devices && Array.isArray(response.data.devices)) {
          apiDevices = response.data.devices;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          apiDevices = response.data.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          apiDevices = response.data.results;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          apiDevices = response.data.items;
        }
      }

      // Transform API response: API returns devices with pushTokens array,
      // but frontend expects one device per pushToken
      const devicesList: Device[] = [];
      for (const apiDevice of apiDevices) {
        const pushTokens = apiDevice.pushTokens || [];
        // If no push tokens, create one entry with empty pushToken (shouldn't happen, but handle gracefully)
        if (pushTokens.length === 0) {
          devicesList.push({
            username: apiDevice.username || null,
            pushToken: "", // Will be handled in render
            deviceInfo: apiDevice.deviceInfo || null,
            deviceType: apiDevice.deviceType || null,
            alertCount: apiDevice.alertCount || 0,
            activeAlertCount: apiDevice.activeAlertCount || 0,
            createdAt: apiDevice.createdAt || "",
            updatedAt: apiDevice.updatedAt || "",
          });
        } else {
          // Create one device entry per push token
          for (const pushToken of pushTokens) {
            devicesList.push({
              username: apiDevice.username || null,
              pushToken: pushToken,
              deviceInfo: apiDevice.deviceInfo || null,
              deviceType: apiDevice.deviceType || null,
              alertCount: apiDevice.alertCount || 0,
              activeAlertCount: apiDevice.activeAlertCount || 0,
              createdAt: apiDevice.createdAt || "",
              updatedAt: apiDevice.updatedAt || "",
            });
          }
        }
      }

      setDevices(devicesList);
      console.log(`Loaded ${devicesList.length} device(s)`, {
        total: devicesList.length,
        withUsername: devicesList.filter(d => d.username).length,
        withoutUsername: devicesList.filter(d => !d.username).length,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load devices";
      setDevicesError(errorMessage);
      console.error("Failed to load devices:", err);
      setDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      loadNotifications();
    } else if (activeTab === "devices") {
      loadDevices();
    } else if (activeTab === "users") {
      // Load all users (includes users with no activity)
      // allUsers already includes favoriteStocks for each user
      loadAllUsers();
      loadDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, viewMode]);

  // Action handlers
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

  const handleCreateAlert = async (data: CreateAlertRequest | UpdateAlertRequest) => {
    try {
      await createAlert(data as CreateAlertRequest);
      setShowForm(false);
      showToast("Alert created successfully!", "success");
    } catch (err) {
      showToast(createError?.message || "Failed to create alert", "error");
      throw err;
    }
  };

  const handleUpdateAlert = async (data: CreateAlertRequest | UpdateAlertRequest) => {
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

  const handleSendTestNotification = async (pushToken: string) => {
    setTestingDeviceId(pushToken);
    try {
      const response = await axiosClient.post(
        `/v1/api/devices/test`,
        { pushToken },
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

  const handleUserCardClick = (userCard: UserCardData) => {
    navigate(`/monitoring/users/${userCard.username}`);
  };

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

  const parseDeviceInfo = (deviceInfo: string | null, deviceType: string | null): string => {
    // First, try to parse deviceInfo JSON to get detailed model information
    if (deviceInfo) {
      try {
        const parsed = JSON.parse(deviceInfo);
        // Try to build a descriptive device name
        const parts: string[] = [];
        
        if (parsed.platform) {
          parts.push(parsed.platform);
        }
        if (parsed.model) {
          parts.push(parsed.model);
        }
        if (parsed.manufacturer) {
          parts.push(parsed.manufacturer);
        }
        
        if (parts.length > 0) {
          return parts.join(" ");
        }
        
        // If we have platform but no model, still return it
        if (parsed.platform) {
          return parsed.platform;
        }
        
        // If it's a plain string (not JSON), return it
        if (typeof deviceInfo === "string" && !deviceInfo.startsWith("{")) {
          return deviceInfo;
        }
      } catch {
        // If parsing fails but it's a string, return it
        if (typeof deviceInfo === "string") {
          return deviceInfo;
        }
      }
    }
    
    // Fall back to deviceType if deviceInfo is not available or doesn't have details
    if (deviceType) {
      return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
    }
    
    return "Unknown Device";
  };

  const renderAlertRow = (alert: Alert) => {
    const currentPrice = priceMap.get(alert.symbol);
    const distance = calculateDistance(alert);
    const isNearThreshold =
      currentPrice &&
      Math.abs(alert.threshold - currentPrice) / currentPrice < 0.05;

    return (
      <tr
        key={alert.id}
        className={alert.status === "paused" ? "paused" : ""}
      >
        <td className="symbol-cell">
          <strong>{alert.symbol}</strong>
        </td>
        <td>
          {currentPrice ? (
            <span className="price">${currentPrice.toFixed(2)}</span>
          ) : (
            <span className="muted">—</span>
          )}
        </td>
        <td>
          <span className={`direction-badge ${alert.direction}`}>
            {alert.direction === "above" ? "↑ Above" : "↓ Below"}
          </span>
        </td>
        <td>
          <strong>${alert.threshold.toFixed(2)}</strong>
        </td>
        <td>
          {distance ? (
            <span className={`distance ${isNearThreshold ? "near" : ""}`}>
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
            <span className="legacy-badge">Legacy Alert (Disabled)</span>
          )}
        </td>
        <td>
          {alert.username ? (
            <span style={{ fontWeight: "600", color: "var(--accent-color)" }}>
              @{alert.username}
            </span>
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

  const renderDeviceRow = (device: Device) => {
    const deviceAlerts = device.username
      ? alerts.filter(a => a.username === device.username)
      : [];
    const activeAlerts = deviceAlerts.filter(a => a.status === "active");

    return (
      <tr
        key={device.pushToken || `device-${device.username || 'unknown'}-${device.updatedAt}`}
        style={!device.username ? {
          background: "rgba(245, 158, 11, 0.05)",
          borderLeft: "3px solid #f59e0b"
        } : {}}
      >
        <td>
          <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
            {parseDeviceInfo(device.deviceInfo, device.deviceType)}
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
              <span>⚠️</span>
              <span>Unregistered</span>
            </span>
          )}
        </td>
        <td>
          <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
            {device.pushToken ? `${device.pushToken.substring(0, 40)}...` : "—"}
          </span>
        </td>
        <td>
          <span style={{ fontWeight: 500 }}>
            {activeAlerts.length} active / {deviceAlerts.length} total
          </span>
        </td>
        <td>
          <span className="muted">
            {device.updatedAt ? new Date(device.updatedAt).toLocaleDateString() : "—"}
          </span>
        </td>
        <td>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => device.pushToken && handleSendTestNotification(device.pushToken)}
              disabled={!device.pushToken || testingDeviceId === device.pushToken}
              className="btn-edit"
              style={{ fontSize: "0.875rem", padding: "0.25rem 0.5rem", opacity: !device.pushToken ? 0.5 : 1 }}
            >
              {testingDeviceId === device.pushToken ? "Sending..." : "Test"}
            </button>
            <button
              type="button"
              onClick={() => device.pushToken && handleDeleteDevice(device.pushToken)}
              disabled={!device.pushToken || deletingDeviceId === device.pushToken}
              className="btn-delete"
              style={{ fontSize: "0.875rem", padding: "0.25rem 0.5rem", opacity: (!device.pushToken || deletingDeviceId === device.pushToken) ? 0.6 : 1 }}
            >
              {deletingDeviceId === device.pushToken ? "Deleting..." : "Delete"}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
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
      </div>

      {/* Header with actions */}
      <div className="alerts-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
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
          {activeTab === "users" && (
            <button
              type="button"
              onClick={() => {
                loadAllUsers();
              }}
              disabled={usersLoading}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                background: "var(--ghost-border)",
                color: "var(--text-primary)",
                border: "1px solid var(--ghost-border)",
                borderRadius: "6px",
                cursor: usersLoading ? "not-allowed" : "pointer",
                opacity: usersLoading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {usersLoading ? "🔄" : "↻"} Refresh
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
        </div>
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

                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      fontSize: "0.875rem", 
                      border: "1px solid var(--ghost-border)", 
                      borderRadius: "6px",
                      background: "var(--surface-color)",
                      color: "var(--text-primary)",
                      cursor: "pointer"
                    }}
                  >
                    <option value="all">All Users</option>
                    {uniqueUsernames.map((username) => (
                      <option key={username} value={username}>
                        @{username}
                      </option>
                    ))}
                  </select>

                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "var(--text-primary)"
                  }}>
                    <input
                      type="checkbox"
                      checked={groupByUsername}
                      onChange={(e) => setGroupByUsername(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>Group by Username</span>
                  </label>
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
                      <div className="empty-icon">📊</div>
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
                          {sortField === "threshold" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th>Distance</th>
                        <th onClick={() => handleSort("status")}>
                          Status{" "}
                          {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th>Channel</th>
                        <th>User</th>
                        <th onClick={() => handleSort("createdAt")}>
                          Created{" "}
                          {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupByUsername ? (
                        // Group alerts by username
                        (() => {
                          const grouped = filteredAlerts.reduce((acc, alert) => {
                            const key = alert.username || "Unknown";
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(alert);
                            return acc;
                          }, {} as Record<string, Alert[]>);

                          return Object.entries(grouped).map(([username, userAlerts]) => (
                            <React.Fragment key={username}>
                              <tr style={{ 
                                background: "var(--ghost-border)", 
                                fontWeight: "600",
                                fontSize: "0.875rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                              }}>
                                <td colSpan={10} style={{ padding: "0.75rem 1rem" }}>
                                  {username === "Unknown" ? (
                                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                                      Unknown User ({userAlerts.length} alert{userAlerts.length !== 1 ? "s" : ""})
                                    </span>
                                  ) : (
                                    <span style={{ color: "var(--accent-color)" }}>
                                      @{username} ({userAlerts.length} alert{userAlerts.length !== 1 ? "s" : ""})
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {userAlerts.map((alert) => renderAlertRow(alert))}
                            </React.Fragment>
                          ));
                        })()
                      ) : (
                        filteredAlerts.map((alert) => renderAlertRow(alert))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
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
                  <div className="empty-icon">📋</div>
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
                                {notification.username || "—"}
                              </span>
                            </td>
                            <td className="target-cell">
                              <span className="truncate" style={{ maxWidth: "120px" }}>
                                {notification.pushToken ? `${notification.pushToken.substring(0, 20)}...` : "—"}
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
              {devices.filter(d => !d.username).length > 0 && (
                <div style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "8px"
                }}>
                  <p style={{ margin: 0, color: "#f59e0b", fontWeight: "600", marginBottom: "0.5rem" }}>
                    ⚠️ Info: {devices.filter(d => !d.username).length} unregistered device{devices.filter(d => !d.username).length !== 1 ? "s" : ""} found
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    These devices have push tokens but are not associated with any user account.
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
                        <th>Push Token</th>
                        <th>Alerts</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device) => renderDeviceRow(device))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Users Tab - Card-based UI */}
      {activeTab === "users" && (
        <div style={{ padding: "1.5rem 0" }}>
          {usersLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <>
              {usersError && (
                <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                  <p style={{ color: "#f87171", margin: 0 }}>❌ {usersError}</p>
                </div>
              )}
              {userCardsData.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No users found</h3>
                  <p>No users have selected favorite stocks yet.</p>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}>
                  {userCardsData.map((userCard) => (
                    <UserCard
                      key={userCard.username}
                      user={userCard}
                      onClick={() => handleUserCardClick(userCard)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Dialogs */}
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

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

