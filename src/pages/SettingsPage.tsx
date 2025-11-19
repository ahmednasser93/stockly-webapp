import { useState, useEffect } from "react";
import { useAdminConfig } from "../hooks/useAdminConfig";
import { useMonitoringSnapshot } from "../hooks/useMonitoringSnapshot";
import { simulateProviderFailure, disableProviderFailure } from "../api/adminConfig";
import {
  getUserSettings,
  updateUserSettings,
  getUserPreferences,
  updateUserPreferences,
} from "../api/userSettings";

type SettingsTab = "settings" | "monitoring" | "developer";

const PROVIDER_OPTIONS = ["alpha-feed", "beta-feed", "gamma-fallback"];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("settings");
  
  // User ID - in real app, get from auth context
  const [userId] = useState("demo-user");
  
  // Admin Settings
  const { config, loading: adminLoading, error: adminError, saveConfig } = useAdminConfig();
  const [polling, setPolling] = useState(30);
  const [kvWriteInterval, setKvWriteInterval] = useState(3600);
  const [primary, setPrimary] = useState(PROVIDER_OPTIONS[0]);
  const [backup, setBackup] = useState(PROVIDER_OPTIONS[1]);
  const [maxAlerts, setMaxAlerts] = useState(100);
  const [windowSeconds, setWindowSeconds] = useState(60);
  const [alertingEnabled, setAlertingEnabled] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [simulateProviderFailureFlag, setSimulateProviderFailureFlag] = useState(false);
  
  // User Settings
  const [refreshIntervalMinutes, setRefreshIntervalMinutes] = useState(5);
  const [userSettingsLoading, setUserSettingsLoading] = useState(true);
  const [userSettingsError, setUserSettingsError] = useState<string | null>(null);
  
  // User Preferences
  const [enabled, setEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [allowedSymbols, setAllowedSymbols] = useState("");
  const [maxDaily, setMaxDaily] = useState("");
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  
  // Status messages
  const [settingsStatus, setSettingsStatus] = useState<string>("");
  const [simulationStatus, setSimulationStatus] = useState<string>("");

  // Monitoring
  const { snapshot, loading: monitoringLoading, error: monitoringError } = useMonitoringSnapshot();

  // Helper function to format interval in human-readable format
  const formatInterval = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
  };

  // Load admin config
  useEffect(() => {
    if (!config) return;
    setPolling(config.pollingIntervalSec);
    setKvWriteInterval(config.kvWriteIntervalSec ?? 3600);
    setPrimary(config.primaryProvider);
    setBackup(config.backupProvider);
    setMaxAlerts(config.alertThrottle.maxAlerts);
    setWindowSeconds(config.alertThrottle.windowSeconds);
    setAlertingEnabled(config.featureFlags.alerting);
    setSandboxMode(config.featureFlags.sandboxMode);
    setSimulateProviderFailureFlag(config.featureFlags.simulateProviderFailure);
    // Clear simulation status when config changes
    if (config.featureFlags.simulateProviderFailure && !simulationStatus.includes("ACTIVE")) {
      setSimulationStatus("");
    } else if (!config.featureFlags.simulateProviderFailure && simulationStatus.includes("ACTIVE")) {
      setSimulationStatus("");
    }
  }, [config, simulationStatus]);

  // Load user settings
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setUserSettingsLoading(true);
        setUserSettingsError(null);
        const settings = await getUserSettings(userId);
        if (mounted) {
          setRefreshIntervalMinutes(settings.refreshIntervalMinutes);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = (err as Error).message || "Failed to load user settings";
          // Only show error for non-404 errors (network issues, etc.)
          if (!errorMessage.includes("404") && !errorMessage.includes("not found")) {
            setUserSettingsError(errorMessage);
            console.warn("Failed to load user settings, using defaults", err);
          }
          // Use default value if API fails
          setRefreshIntervalMinutes(5);
        }
      } finally {
        if (mounted) {
          setUserSettingsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Load user preferences
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPreferencesLoading(true);
        setPreferencesError(null);
        const prefs = await getUserPreferences(userId);
        if (mounted) {
          setEnabled(prefs.enabled);
          setQuietStart(prefs.quietStart || "");
          setQuietEnd(prefs.quietEnd || "");
          setMaxDaily(prefs.maxDaily ? String(prefs.maxDaily) : "");
          setAllowedSymbols(prefs.allowedSymbols ? prefs.allowedSymbols.join(", ") : "");
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = (err as Error).message || "Failed to load user preferences";
          // Only show error for non-404 errors (network issues, etc.)
          if (!errorMessage.includes("404") && !errorMessage.includes("not found")) {
            setPreferencesError(errorMessage);
            console.warn("Failed to load user preferences, using defaults", err);
          }
          // Use default values if API fails
          setEnabled(true);
          setQuietStart("");
          setQuietEnd("");
          setMaxDaily("");
          setAllowedSymbols("");
        }
      } finally {
        if (mounted) {
          setPreferencesLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleSettingsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSettingsStatus("Saving…");
    
    try {
      // Update admin config
      await saveConfig({
        pollingIntervalSec: polling,
        kvWriteIntervalSec: kvWriteInterval,
        primaryProvider: primary,
        backupProvider: backup,
        alertThrottle: { maxAlerts, windowSeconds },
        featureFlags: {
          alerting: alertingEnabled,
          sandboxMode,
          simulateProviderFailure: simulateProviderFailureFlag,
        },
      });
      
      // Update user settings
      const refreshIntervalMinutesNum = Math.max(1, Math.min(720, Math.round(Number(refreshIntervalMinutes) || 5)));
      await updateUserSettings({
        userId,
        refreshIntervalMinutes: refreshIntervalMinutesNum,
      });
      
      // Update user preferences
      const symbolsArray = allowedSymbols
        ? allowedSymbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
        : null;
      
      await updateUserPreferences({
        userId,
        enabled,
        quietStart: quietStart || null,
        quietEnd: quietEnd || null,
        allowedSymbols: symbolsArray,
        maxDaily: maxDaily ? parseInt(maxDaily, 10) : null,
      });
      
      setSettingsStatus("Settings saved successfully");
      setTimeout(() => setSettingsStatus(""), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSettingsStatus("Failed to save settings");
      setTimeout(() => setSettingsStatus(""), 3000);
    }
  };

  const handleSimulateProviderFailure = async () => {
    setSimulationStatus("Enabling…");
    try {
      const updated = await simulateProviderFailure();
      if (updated.featureFlags.simulateProviderFailure) {
        setSimulationStatus("Simulation ACTIVE");
      }
      // Refresh config in hook
      await saveConfig({});
    } catch (error) {
      setSimulationStatus("Failed to enable simulation");
    }
  };

  const handleDisableProviderFailure = async () => {
    setSimulationStatus("Disabling…");
    try {
      const updated = await disableProviderFailure();
      if (!updated.featureFlags.simulateProviderFailure) {
        setSimulationStatus("Simulation OFF");
      }
      // Refresh config in hook
      await saveConfig({});
    } catch (error) {
      setSimulationStatus("Failed to disable simulation");
    }
  };

  return (
    <section className="page">
      <div className="card">
        <div className="alerts-header">
          <div>
            <h1>Settings</h1>
            <p className="muted">
              Configure app preferences, admin settings, and view system monitoring
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
          <button
            type="button"
            className={activeTab === "monitoring" ? "active" : ""}
            onClick={() => setActiveTab("monitoring")}
          >
            Monitoring
          </button>
          <button
            type="button"
            className={activeTab === "developer" ? "active" : ""}
            onClick={() => setActiveTab("developer")}
          >
            Developer Tools
          </button>
        </div>

        {/* Settings Tab - Merged App and Admin Settings */}
        {activeTab === "settings" && (
          <div>
            {(adminLoading || userSettingsLoading || preferencesLoading) ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading settings…</p>
              </div>
            ) : (
              <>
                {(adminError || userSettingsError || preferencesError) && (
                  <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                    {adminError && <p style={{ color: "#f87171", margin: "0.25rem 0" }}>❌ Admin Config: {adminError}</p>}
                    {userSettingsError && <p style={{ color: "#f87171", margin: "0.25rem 0" }}>⚠️ User Settings: {userSettingsError}</p>}
                    {preferencesError && <p style={{ color: "#f87171", margin: "0.25rem 0" }}>⚠️ Preferences: {preferencesError}</p>}
                  </div>
                )}
                <h2>Configuration Settings</h2>
                <p className="muted">Configure admin settings, user preferences, and notification preferences.</p>
                {settingsStatus && <p className="status-chip">{settingsStatus}</p>}
                <form className="settings-form" onSubmit={handleSettingsSubmit} style={{ width: "100%", maxWidth: "100%" }}>
                  {/* Admin Configuration Section */}
                  <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid var(--ghost-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      <h3 style={{ margin: 0 }}>Admin Configuration</h3>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        padding: "0.25rem 0.5rem", 
                        background: "rgba(59, 130, 246, 0.1)", 
                        color: "#3b82f6", 
                        borderRadius: "4px",
                        fontWeight: "600"
                      }}>SYSTEM-WIDE</span>
                    </div>
                    <p style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                      These settings affect all users and control server-side behavior. Changes impact the entire system.
                    </p>
                    
                    <label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>Polling Interval (seconds)</span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          padding: "0.125rem 0.375rem", 
                          background: "rgba(34, 197, 94, 0.1)", 
                          color: "#22c55e", 
                          borderRadius: "4px",
                          fontWeight: "500"
                        }}>10-300</span>
                      </div>
                      <input
                        type="number"
                        min={10}
                        max={300}
                        value={polling}
                        onChange={(event) => setPolling(Number(event.target.value))}
                      />
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.75rem", 
                        background: "rgba(59, 130, 246, 0.05)", 
                        border: "1px solid rgba(59, 130, 246, 0.2)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>💡</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: "500" }}>
                            Server-side data refresh rate
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Controls how often the backend fetches fresh stock data from Financial Modeling Prep API. Lower values = fresher data but more API calls. Recommended: 30-60 seconds.
                          </p>
                        </div>
                      </div>
                    </label>
                    
                    <label style={{ marginTop: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>KV Write Interval (seconds)</span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          padding: "0.125rem 0.375rem", 
                          background: "rgba(34, 197, 94, 0.1)", 
                          color: "#22c55e", 
                          borderRadius: "4px",
                          fontWeight: "500"
                        }}>60-86400</span>
                        {kvWriteInterval && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            padding: "0.125rem 0.375rem", 
                            background: "rgba(59, 130, 246, 0.1)", 
                            color: "#3b82f6", 
                            borderRadius: "4px",
                            fontWeight: "500"
                          }}>{formatInterval(kvWriteInterval)}</span>
                        )}
                      </div>
                      <input
                        type="number"
                        min={60}
                        max={86400}
                        step={60}
                        value={kvWriteInterval}
                        onChange={(event) => {
                          const value = Math.max(60, Math.min(86400, Math.round(Number(event.target.value) || 3600)));
                          setKvWriteInterval(value);
                        }}
                      />
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.75rem", 
                        background: "rgba(139, 92, 246, 0.05)", 
                        border: "1px solid rgba(139, 92, 246, 0.2)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>💾</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: "500" }}>
                            Alert state flush interval to KV storage
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Controls how often alert states are flushed from memory cache to KV storage. This batches KV writes for performance optimization. 
                            <strong style={{ color: "var(--text-primary)" }}> Lower values</strong> = more frequent writes (higher costs, fresher data). 
                            <strong style={{ color: "var(--text-primary)" }}> Higher values</strong> = less frequent writes (lower costs, more batched). 
                            Recommended: 1800-7200 seconds (30 minutes to 2 hours). Default: 3600 seconds (1 hour).
                          </p>
                          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => setKvWriteInterval(900)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                background: "rgba(139, 92, 246, 0.1)",
                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                borderRadius: "6px",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                fontWeight: "500"
                              }}
                            >
                              15 min
                            </button>
                            <button
                              type="button"
                              onClick={() => setKvWriteInterval(1800)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                background: "rgba(139, 92, 246, 0.1)",
                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                borderRadius: "6px",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                fontWeight: "500"
                              }}
                            >
                              30 min
                            </button>
                            <button
                              type="button"
                              onClick={() => setKvWriteInterval(3600)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                background: "rgba(139, 92, 246, 0.1)",
                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                borderRadius: "6px",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                fontWeight: "500"
                              }}
                            >
                              1 hour (default)
                            </button>
                            <button
                              type="button"
                              onClick={() => setKvWriteInterval(7200)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                background: "rgba(139, 92, 246, 0.1)",
                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                borderRadius: "6px",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                fontWeight: "500"
                              }}
                            >
                              2 hours
                            </button>
                          </div>
                        </div>
                      </div>
                    </label>
                    
                    <div className="throttle-grid" style={{ marginTop: "1.5rem" }}>
                      <label>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: "600" }}>Alert Throttle - Max Alerts</span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={maxAlerts}
                          onChange={(event) => setMaxAlerts(Number(event.target.value))}
                        />
                        <div style={{ 
                          marginTop: "0.5rem", 
                          padding: "0.5rem", 
                          background: "rgba(168, 85, 247, 0.05)", 
                          borderRadius: "6px"
                        }}>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Maximum alerts allowed in the time window
                          </p>
                        </div>
                      </label>
                      <label>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: "600" }}>Alert Throttle - Window (seconds)</span>
                        </div>
                        <input
                          type="number"
                          min={10}
                          value={windowSeconds}
                          onChange={(event) => setWindowSeconds(Number(event.target.value))}
                        />
                        <div style={{ 
                          marginTop: "0.5rem", 
                          padding: "0.5rem", 
                          background: "rgba(168, 85, 247, 0.05)", 
                          borderRadius: "6px"
                        }}>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Time window for throttling (minimum: 10s)
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    <div style={{ marginTop: "1.5rem" }}>
                      <p style={{ marginBottom: "0.75rem", fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)" }}>Feature Flags</p>
                      <div className="flags-grid">
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={alertingEnabled}
                            onChange={(event) => setAlertingEnabled(event.target.checked)}
                          />
                          <span>Enable Alerting</span>
                        </label>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={sandboxMode}
                            onChange={(event) => setSandboxMode(event.target.checked)}
                          />
                          <span>Sandbox Mode</span>
                        </label>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={simulateProviderFailureFlag}
                            onChange={(event) => setSimulateProviderFailureFlag(event.target.checked)}
                          />
                          <span>Simulate Provider Failure</span>
                        </label>
                      </div>
                      <div style={{ 
                        marginTop: "0.75rem", 
                        padding: "0.75rem", 
                        background: "rgba(251, 191, 36, 0.05)", 
                        border: "1px solid rgba(251, 191, 36, 0.2)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>⚙️</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            <strong style={{ color: "var(--text-primary)" }}>Enable Alerting:</strong> Master switch for the entire alerting system. When disabled, no alerts are evaluated or sent.
                          </p>
                          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            <strong style={{ color: "var(--text-primary)" }}>Sandbox Mode:</strong> Reserved for future use. Enables sandbox testing environment.
                          </p>
                          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            <strong style={{ color: "var(--text-primary)" }}>Simulate Provider Failure:</strong> Returns stale cached data instead of calling external APIs. Useful for testing fallback behavior.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Settings Section */}
                  <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid var(--ghost-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      <h3 style={{ margin: 0 }}>User Settings</h3>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        padding: "0.25rem 0.5rem", 
                        background: "rgba(168, 85, 247, 0.1)", 
                        color: "#a855f7", 
                        borderRadius: "4px",
                        fontWeight: "600"
                      }}>PER-USER</span>
                    </div>
                    <p style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                      Personal preferences stored per user. These settings control client-side behavior only.
                    </p>
                    
                    <label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>Refresh Interval (minutes)</span>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          padding: "0.125rem 0.375rem", 
                          background: "rgba(34, 197, 94, 0.1)", 
                          color: "#22c55e", 
                          borderRadius: "4px",
                          fontWeight: "500"
                        }}>1-720</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={refreshIntervalMinutes}
                        onChange={(event) => setRefreshIntervalMinutes(Number(event.target.value))}
                      />
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.75rem", 
                        background: "rgba(168, 85, 247, 0.05)", 
                        border: "1px solid rgba(168, 85, 247, 0.2)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>🔄</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: "500" }}>
                            Client-side auto-refresh preference
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            How often your browser automatically refreshes stock data. Range: 1 minute to 12 hours (720 minutes). 
                            <strong style={{ color: "var(--text-primary)" }}> Note:</strong> This is a client-side preference only. The API stores it but doesn't use it server-side.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* User Preferences Section */}
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      <h3 style={{ margin: 0 }}>Notification Preferences</h3>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        padding: "0.25rem 0.5rem", 
                        background: "rgba(236, 72, 153, 0.1)", 
                        color: "#ec4899", 
                        borderRadius: "4px",
                        fontWeight: "600"
                      }}>NOTIFICATIONS</span>
                    </div>
                    <p style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                      Control when and how you receive push notifications for price alerts. These preferences are stored per user.
                    </p>
                    
                    <div style={{ 
                      marginBottom: "1.5rem", 
                      padding: "1rem", 
                      background: enabled ? "rgba(34, 197, 94, 0.05)" : "rgba(239, 68, 68, 0.05)", 
                      border: `1px solid ${enabled ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`, 
                      borderRadius: "8px"
                    }}>
                      <label className="toggle" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(event) => setEnabled(event.target.checked)}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: "600", fontSize: "0.9375rem" }}>Enable Notifications</span>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            {enabled 
                              ? "✅ Notifications are enabled. You'll receive push notifications based on your preferences below."
                              : "❌ Notifications are disabled. No push notifications will be sent, even if alerts are triggered."}
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    <label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>Quiet Hours Start (HH:MM)</span>
                        {quietStart && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            padding: "0.125rem 0.375rem", 
                            background: "rgba(59, 130, 246, 0.1)", 
                            color: "#3b82f6", 
                            borderRadius: "4px",
                            fontWeight: "500"
                          }}>{quietStart}</span>
                        )}
                      </div>
                      <input
                        type="time"
                        value={quietStart}
                        onChange={(event) => setQuietStart(event.target.value)}
                        placeholder="22:00"
                        disabled={!enabled}
                      />
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.75rem", 
                        background: "rgba(59, 130, 246, 0.05)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>🌙</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Start time for quiet hours in <strong>24-hour format</strong> (e.g., 22:00 = 10:00 PM). During quiet hours, no notifications will be sent even if alerts are triggered.
                          </p>
                        </div>
                      </div>
                    </label>
                    
                    <label style={{ marginTop: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>Quiet Hours End (HH:MM)</span>
                        {quietEnd && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            padding: "0.125rem 0.375rem", 
                            background: "rgba(59, 130, 246, 0.1)", 
                            color: "#3b82f6", 
                            borderRadius: "4px",
                            fontWeight: "500"
                          }}>{quietEnd}</span>
                        )}
                      </div>
                      <input
                        type="time"
                        value={quietEnd}
                        onChange={(event) => setQuietEnd(event.target.value)}
                        placeholder="08:00"
                        disabled={!enabled}
                      />
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.75rem", 
                        background: "rgba(59, 130, 246, 0.05)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>☀️</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            End time for quiet hours in <strong>24-hour format</strong> (e.g., 08:00 = 8:00 AM). Notifications resume after this time.
                          </p>
                        </div>
                      </div>
                    </label>
                    
                    <label style={{ marginTop: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>Allowed Symbols (comma-separated)</span>
                        {allowedSymbols && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            padding: "0.125rem 0.375rem", 
                            background: "rgba(34, 197, 94, 0.1)", 
                            color: "#22c55e", 
                            borderRadius: "4px",
                            fontWeight: "500"
                          }}>
                            {allowedSymbols.split(",").filter(s => s.trim()).length} symbol{allowedSymbols.split(",").filter(s => s.trim()).length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={allowedSymbols}
                        onChange={(event) => setAllowedSymbols(event.target.value)}
                        placeholder="AAPL, MSFT, GOOGL"
                        disabled={!enabled}
                      />
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.75rem", 
                        background: "rgba(34, 197, 94, 0.05)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>📊</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            <strong style={{ color: "var(--text-primary)" }}>Filter notifications by stock symbols.</strong> Enter comma-separated symbols (e.g., "AAPL, MSFT, GOOGL"). 
                            <strong style={{ color: "var(--text-primary)" }}> Leave empty to receive notifications for all symbols.</strong> Only alerts matching these symbols will trigger push notifications.
                          </p>
                        </div>
                      </div>
                    </label>
                    
                    <label style={{ marginTop: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>Max Daily Notifications</span>
                        {maxDaily && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            padding: "0.125rem 0.375rem", 
                            background: "rgba(251, 191, 36, 0.1)", 
                            color: "#fbbf24", 
                            borderRadius: "4px",
                            fontWeight: "500"
                          }}>Max: {maxDaily}/day</span>
                        )}
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={maxDaily}
                        onChange={(event) => setMaxDaily(event.target.value)}
                        placeholder="10"
                        disabled={!enabled}
                      />
                      <div style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.75rem", 
                        background: "rgba(251, 191, 36, 0.05)", 
                        borderRadius: "8px",
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>🔔</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            <strong style={{ color: "var(--text-primary)" }}>Daily notification limit.</strong> Once this limit is reached, no more notifications will be sent until the next day (resets at midnight). 
                            <strong style={{ color: "var(--text-primary)" }}> Leave empty for unlimited notifications.</strong>
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <button type="submit">Save All Settings</button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === "monitoring" && (
          <div>
            {monitoringLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading monitoring data…</p>
              </div>
            ) : monitoringError ? (
              <div className="error-banner" style={{ padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                <p style={{ color: "#f87171", margin: 0 }}>❌ Failed to load monitoring: {monitoringError}</p>
              </div>
            ) : !snapshot ? (
              <div className="empty-state">
                <p>No monitoring data available</p>
              </div>
            ) : (
              <>
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <h2>Worker latency (ms)</h2>
                  <p className="muted">p95 latency for recent polling windows.</p>
                  <ul className="metric-list">
                    {snapshot.latencyMs.map((value, index) => (
                      <li key={`latency-${index}`}>Window {index + 1}: {value}ms</li>
                    ))}
                  </ul>
                </div>
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <h2>Alert throughput (per min)</h2>
                  <ul className="metric-list">
                    {snapshot.throughputPerMin.map((value, index) => (
                      <li key={`throughput-${index}`}>Minute {index + 1}: {value}</li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h2>Error rate</h2>
                  <ul className="metric-list">
                    {snapshot.errorRate.map((value, index) => (
                      <li key={`error-${index}`}>Minute {index + 1}: {value}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* Developer Tools Tab */}
        {activeTab === "developer" && (
          <div>
            {adminLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading config…</p>
              </div>
            ) : adminError ? (
              <div className="error-banner" style={{ padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                <p style={{ color: "#f87171", margin: 0 }}>❌ Failed to load config: {adminError}</p>
              </div>
            ) : (
              <>
                <h2>Provider Failure Simulation</h2>
                <p className="muted">Test fallback behavior when external providers fail. When enabled, the API will return stale cached data instead of calling external providers.</p>
                
                {/* Status Indicator */}
                <div style={{ marginBottom: "1.5rem", padding: "1rem", background: config?.featureFlags.simulateProviderFailure ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", border: `1px solid ${config?.featureFlags.simulateProviderFailure ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`, borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: config?.featureFlags.simulateProviderFailure ? "#ef4444" : "#22c55e" }}>
                    {config?.featureFlags.simulateProviderFailure ? "🔴 Simulation ACTIVE" : "🟢 Simulation OFF"}
                  </p>
                </div>

                {simulationStatus && (
                  <p className="status-chip" style={{ marginBottom: "1rem" }}>{simulationStatus}</p>
                )}

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleSimulateProviderFailure}
                    disabled={config?.featureFlags.simulateProviderFailure === true}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: config?.featureFlags.simulateProviderFailure ? "#9ca3af" : "#3b82f6",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: config?.featureFlags.simulateProviderFailure ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Trigger Provider Failure (Test Mode)
                  </button>
                  <button
                    type="button"
                    onClick={handleDisableProviderFailure}
                    disabled={config?.featureFlags.simulateProviderFailure === false}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: config?.featureFlags.simulateProviderFailure === false ? "#9ca3af" : "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: config?.featureFlags.simulateProviderFailure === false ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Disable Failure Simulation
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
