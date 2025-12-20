import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAlerts } from "../hooks/useAlerts";
import { fetchStocks } from "../api/client";
import { AlertForm } from "../components/AlertForm";
import { DeleteAlertDialog } from "../components/DeleteAlertDialog";
import { axiosClient } from "../api/axios-client";
import type { Alert, CreateAlertRequest, UpdateAlertRequest } from "../types";
import { ArrowLeft, TrendingUp, Bell, Smartphone, Edit, Trash2, TestTube } from "lucide-react";

interface UserDevice {
  deviceId?: number;
  userId?: string | null;
  username: string | null;
  pushTokens: string[]; // Array of push tokens (new schema)
  pushToken?: string; // Legacy support (old schema)
  deviceInfo: string | null;
  deviceType: string | null;
  alertCount?: number;
  activeAlertCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function UserDetailPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const {
    alerts,
    createAlert,
    updateAlert,
    deleteAlert,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
  } = useAlerts();

  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);
  const [userDetails, setUserDetails] = useState<{ userId: string; username: string | null; email: string | null; createdAt: string | null; updatedAt: string | null } | null>(null);
  const [favoriteStocks, setFavoriteStocks] = useState<string[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [userAlertsData, setUserAlertsData] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Use alerts from API (userAlertsData) or fallback to filtered alerts from useAlerts hook
  const userAlerts = useMemo(() => {
    if (userAlertsData.length > 0) {
      return userAlertsData;
    }
    if (!username) return [];
    return alerts.filter(a => a.username === username);
  }, [userAlertsData, alerts, username]);

  // Fetch prices for user's favorite stocks
  const pricesQuery = useQuery({
    queryKey: ["stocks", favoriteStocks],
    queryFn: () => fetchStocks(favoriteStocks),
    enabled: favoriteStocks.length > 0,
    staleTime: 30 * 1000,
  });

  // Load user data
  useEffect(() => {
    if (!username) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get user details (username, email, etc.)
        const userResponse = await axiosClient.get(`/v1/api/users/${encodeURIComponent(username)}`);
        setUserDetails(userResponse.data);

        // 2. Get devices for this user
        const devicesResponse = await axiosClient.get(`/v1/api/users/${encodeURIComponent(username)}/devices`);
        let devicesList: UserDevice[] = [];
        if (devicesResponse.data) {
          if (Array.isArray(devicesResponse.data)) {
            devicesList = devicesResponse.data;
          } else if (devicesResponse.data.devices && Array.isArray(devicesResponse.data.devices)) {
            devicesList = devicesResponse.data.devices;
          }
        }
        setDevices(devicesList);

        // 3. Get alerts for this user
        const alertsResponse = await axiosClient.get(`/v1/api/users/${encodeURIComponent(username)}/alerts`);
        let alertsList: Alert[] = [];
        if (alertsResponse.data) {
          if (Array.isArray(alertsResponse.data)) {
            alertsList = alertsResponse.data;
          } else if (alertsResponse.data.alerts && Array.isArray(alertsResponse.data.alerts)) {
            alertsList = alertsResponse.data.alerts;
          }
        }
        setUserAlertsData(alertsList);

        // 4. Get favorite stocks for this user
        const stocksResponse = await axiosClient.get(`/v1/api/users/${encodeURIComponent(username)}/favorite-stocks`);
        let stocksList: string[] = [];
        if (stocksResponse.data) {
          if (stocksResponse.data.stocks && Array.isArray(stocksResponse.data.stocks)) {
            stocksList = stocksResponse.data.stocks.map((s: { symbol: string } | string) => 
              typeof s === "string" ? s : s.symbol
            );
          }
        }
        setFavoriteStocks(stocksList);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
        if (error?.response?.status === 404) {
          setError("User not found");
        } else {
          setError(error?.response?.data?.error || error?.message || "Failed to load user data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [username]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
        // Reload devices
        if (!username) return;
        const devicesResponse = await axiosClient.get(`/v1/api/users/${encodeURIComponent(username)}/devices`);
        let devicesList: UserDevice[] = [];
        if (devicesResponse.data) {
          if (Array.isArray(devicesResponse.data)) {
            devicesList = devicesResponse.data;
          } else if (devicesResponse.data.devices && Array.isArray(devicesResponse.data.devices)) {
            devicesList = devicesResponse.data.devices;
          }
        }
        setDevices(devicesList);
      } else {
        showToast(response.data.error || "Failed to delete device", "error");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete device";
      showToast(errorMessage, "error");
    } finally {
      setDeletingDeviceId(null);
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

  if (loading) {
    return (
      <section className="page">
        <div className="card">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading user data...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !username) {
    return (
      <section className="page">
        <div className="card">
          <div className="error-banner" style={{ padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
            <p style={{ color: "#f87171", margin: 0 }}>❌ {error || "User not found"}</p>
            <button
              type="button"
              onClick={() => navigate("/monitoring")}
              style={{ marginTop: "1rem", padding: "0.5rem 1rem", fontSize: "0.875rem" }}
            >
              Back to Monitoring
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="card">
        {/* Header with back button */}
        <div style={{ marginBottom: "2rem" }}>
          <button
            type="button"
            onClick={() => navigate("/monitoring")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              marginBottom: "1.5rem",
              background: "transparent",
              border: "1px solid var(--ghost-border)",
              borderRadius: "0.5rem",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--ghost-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Monitoring
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", fontWeight: "700" }}>
                User Overview
              </h1>
              <div style={{ fontSize: "1.125rem", color: "var(--accent-color)", fontWeight: "600" }}>
                @{username}
              </div>
              {userDetails?.email && (
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {userDetails.email}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setEditingAlert(null);
                  setShowForm(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "var(--accent-color)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Bell style={{ width: "16px", height: "16px" }} />
                Create Alert
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <TrendingUp style={{ width: "20px", height: "20px", color: "var(--accent-color)" }} />
              <div style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                Favorite Stocks
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {favoriteStocks.length}
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Bell style={{ width: "20px", height: "20px", color: "#22c55e" }} />
              <div style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                Alerts
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {userAlerts.length}
            </div>
            {userAlerts.length > 0 && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {userAlerts.filter(a => a.status === "active").length} active
              </div>
            )}
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Smartphone style={{ width: "20px", height: "20px", color: "#f59e0b" }} />
              <div style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                Devices
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {devices.length}
            </div>
          </div>
        </div>

        {/* Favorite Stocks Section */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: "700",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}>
            <TrendingUp style={{ width: "16px", height: "16px" }} />
            Favorite Stocks
          </div>
          <div style={{
            background: "var(--surface-color)",
            border: "1px solid var(--ghost-border)",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            minHeight: "100px",
          }}>
            {favoriteStocks.length > 0 ? (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {favoriteStocks.map((symbol) => {
                  const price = pricesQuery.data?.find((q) => q.symbol === symbol);
                  return (
                    <div
                      key={symbol}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "0.5rem",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      onClick={() => navigate(`/stocks/${symbol}`)}
                    >
                      <span style={{ fontWeight: "700", fontSize: "1rem", color: "var(--accent-color)" }}>
                        {symbol}
                      </span>
                      {price && (
                        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                          ${price.price?.toFixed(2) || "—"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                color: "var(--text-muted)",
              }}>
                <TrendingUp style={{ width: "48px", height: "48px", opacity: 0.3, marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontSize: "0.875rem", fontStyle: "italic" }}>
                  No favorite stocks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts Section */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: "700",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}>
            <Bell style={{ width: "16px", height: "16px" }} />
            Alerts ({userAlerts.length})
          </div>
          <div style={{
            background: "var(--surface-color)",
            border: "1px solid var(--ghost-border)",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            minHeight: "100px",
          }}>
            {userAlerts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {userAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      background: alert.status === "paused" ? "rgba(148, 163, 184, 0.1)" : "rgba(59, 130, 246, 0.05)",
                      border: `1px solid ${alert.status === "paused" ? "rgba(148, 163, 184, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.borderColor = "var(--accent-color)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.borderColor = alert.status === "paused" ? "rgba(148, 163, 184, 0.3)" : "rgba(59, 130, 246, 0.2)";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "700", fontSize: "1.125rem", color: "var(--accent-color)" }}>
                          {alert.symbol}
                        </span>
                        <span style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: alert.status === "active" ? "rgba(34, 197, 94, 0.15)" : "rgba(148, 163, 184, 0.15)",
                          color: alert.status === "active" ? "#22c55e" : "var(--text-muted)",
                        }}>
                          {alert.status === "active" ? "🟢 Active" : "⏸️ Paused"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <span>
                          {alert.direction === "above" ? "↑ Above" : "↓ Below"} ${alert.threshold.toFixed(2)}
                        </span>
                        {alert.notes && (
                          <span style={{ fontStyle: "italic" }}>
                            {alert.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAlert(alert);
                          setShowForm(true);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.5rem 0.75rem",
                          background: "rgba(59, 130, 246, 0.1)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "0.375rem",
                          color: "var(--accent-color)",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                        }}
                      >
                        <Edit style={{ width: "14px", height: "14px" }} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAlert(alert)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.5rem 0.75rem",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "0.375rem",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        }}
                      >
                        <Trash2 style={{ width: "14px", height: "14px" }} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                color: "var(--text-muted)",
              }}>
                <Bell style={{ width: "48px", height: "48px", opacity: 0.3, marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontSize: "0.875rem", fontStyle: "italic" }}>
                  No alerts configured
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Devices Section */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: "700",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}>
            <Smartphone style={{ width: "16px", height: "16px" }} />
            Devices ({devices.length})
          </div>
          <div style={{
            background: "var(--surface-color)",
            border: "1px solid var(--ghost-border)",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            minHeight: "100px",
          }}>
            {devices.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {devices.map((device, deviceIndex) => {
                  // Get push tokens - support both new schema (pushTokens array) and old schema (pushToken string)
                  // pushTokens can be an array of strings or array of objects with pushToken property
                  let pushTokens: string[] = [];
                  if (device.pushTokens && Array.isArray(device.pushTokens)) {
                    pushTokens = device.pushTokens.map((token: string | { pushToken: string }) => 
                      typeof token === "string" ? token : token.pushToken
                    );
                  } else if (device.pushToken) {
                    pushTokens = [device.pushToken];
                  }
                  const deviceKey = device.deviceId || device.pushToken || `device-${deviceIndex}`;
                  
                  return pushTokens.map((pushToken, tokenIndex) => (
                    <div
                      key={`${deviceKey}-${tokenIndex}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        background: "rgba(245, 158, 11, 0.05)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.borderColor = "#f59e0b";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.2)";
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                          {parseDeviceInfo(device.deviceInfo, device.deviceType)}
                          {pushTokens.length > 1 && (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                              (Token {tokenIndex + 1} of {pushTokens.length})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", wordBreak: "break-all", marginBottom: "0.25rem" }}>
                          {pushToken ? `${pushToken.substring(0, 50)}...` : "No push token"}
                        </div>
                        {device.activeAlertCount !== undefined && device.alertCount !== undefined && (
                          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                            {device.activeAlertCount} active / {device.alertCount} total alerts
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => handleSendTestNotification(pushToken)}
                          disabled={testingDeviceId === pushToken}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            background: "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                            border: "1px solid rgba(147, 51, 234, 0.3)",
                            borderRadius: "0.375rem",
                            color: "#9333ea",
                            cursor: testingDeviceId === pushToken ? "not-allowed" : "pointer",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                            opacity: testingDeviceId === pushToken ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (testingDeviceId !== pushToken) {
                              e.currentTarget.style.background = "linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)";
                          }}
                        >
                          <TestTube style={{ width: "14px", height: "14px" }} />
                          {testingDeviceId === pushToken ? "Sending..." : "Test"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDevice(pushToken)}
                          disabled={deletingDeviceId === pushToken}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "0.375rem",
                            color: "#ef4444",
                            cursor: deletingDeviceId === pushToken ? "not-allowed" : "pointer",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                            opacity: deletingDeviceId === pushToken ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (deletingDeviceId !== pushToken) {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          }}
                        >
                          <Trash2 style={{ width: "14px", height: "14px" }} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ));
                })}
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                color: "var(--text-muted)",
              }}>
                <Smartphone style={{ width: "48px", height: "48px", opacity: 0.3, marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontSize: "0.875rem", fontStyle: "italic" }}>
                  No devices registered
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showForm && (
        <AlertForm
          alert={editingAlert || undefined}
          onSubmit={editingAlert ? handleUpdateAlert : handleCreateAlert}
          onCancel={() => {
            setShowForm(false);
            setEditingAlert(null);
          }}
          isSubmitting={editingAlert ? isUpdating : isCreating}
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
        <div
          className={`toast ${toast.type}`}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 1000,
          }}
        >
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
    </section>
  );
}

