import { useState, useEffect } from "react";
import { useSettings } from "../state/SettingsContext";
import { useAdminConfig } from "../hooks/useAdminConfig";
import { useMonitoringSnapshot } from "../hooks/useMonitoringSnapshot";
import { simulateProviderFailure, disableProviderFailure } from "../api/adminConfig";

type SettingsTab = "app" | "admin" | "monitoring" | "developer";

const PROVIDER_OPTIONS = ["alpha-feed", "beta-feed", "gamma-fallback"];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("app");
  
  // App Settings
  const { refreshInterval, updateRefreshInterval } = useSettings();
  const [value, setValue] = useState(refreshInterval.toString());

  // Admin Settings
  const { config, loading: adminLoading, error: adminError, saveConfig } = useAdminConfig();
  const [polling, setPolling] = useState(30);
  const [primary, setPrimary] = useState(PROVIDER_OPTIONS[0]);
  const [backup, setBackup] = useState(PROVIDER_OPTIONS[1]);
  const [maxAlerts, setMaxAlerts] = useState(100);
  const [windowSeconds, setWindowSeconds] = useState(60);
  const [alertingEnabled, setAlertingEnabled] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [adminStatus, setAdminStatus] = useState<string>("");
  const [simulationStatus, setSimulationStatus] = useState<string>("");

  // Monitoring
  const { snapshot, loading: monitoringLoading, error: monitoringError } = useMonitoringSnapshot();

  useEffect(() => {
    if (!config) return;
    setPolling(config.pollingIntervalSec);
    setPrimary(config.primaryProvider);
    setBackup(config.backupProvider);
    setMaxAlerts(config.alertThrottle.maxAlerts);
    setWindowSeconds(config.alertThrottle.windowSeconds);
    setAlertingEnabled(config.featureFlags.alerting);
    setSandboxMode(config.featureFlags.sandboxMode);
    // Clear simulation status when config changes
    if (config.featureFlags.simulateProviderFailure && !simulationStatus.includes("ACTIVE")) {
      setSimulationStatus("");
    } else if (!config.featureFlags.simulateProviderFailure && simulationStatus.includes("ACTIVE")) {
      setSimulationStatus("");
    }
  }, [config]);

  const handleAppSettingsSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    updateRefreshInterval(parsed);
  };

  const handleAdminSettingsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdminStatus("Saving…");
    await saveConfig({
      pollingIntervalSec: polling,
      primaryProvider: primary,
      backupProvider: backup,
      alertThrottle: { maxAlerts, windowSeconds },
      featureFlags: { alerting: alertingEnabled, sandboxMode, simulateProviderFailure: config?.featureFlags.simulateProviderFailure || false },
    });
    setAdminStatus("Configuration saved");
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
            className={activeTab === "app" ? "active" : ""}
            onClick={() => setActiveTab("app")}
          >
            App Settings
          </button>
          <button
            type="button"
            className={activeTab === "admin" ? "active" : ""}
            onClick={() => setActiveTab("admin")}
          >
            Admin Settings
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

        {/* App Settings Tab */}
        {activeTab === "app" && (
          <div>
            <form onSubmit={handleAppSettingsSubmit} className="settings-form">
              <label>
                Refresh interval (seconds)
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <p className="muted">
                Stocks automatically refresh according to this interval.
              </p>
              <button type="submit">Save</button>
            </form>
          </div>
        )}

        {/* Admin Settings Tab */}
        {activeTab === "admin" && (
          <div>
            {adminLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading admin config…</p>
              </div>
            ) : adminError ? (
              <div className="error-banner" style={{ padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
                <p style={{ color: "#f87171", margin: 0 }}>❌ Failed to load config: {adminError}</p>
              </div>
            ) : (
              <>
                <h2>Backend configuration</h2>
                <p className="muted">Adjust polling cadence, provider routing, and feature flags.</p>
                {adminStatus && <p className="status-chip">{adminStatus}</p>}
                <form className="settings-form" onSubmit={handleAdminSettingsSubmit}>
                  <label>
                    Price polling interval (seconds)
                    <input
                      type="number"
                      min={15}
                      value={polling}
                      onChange={(event) => setPolling(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Primary quote provider
                    <select value={primary} onChange={(event) => setPrimary(event.target.value)}>
                      {PROVIDER_OPTIONS.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Backup provider
                    <select value={backup} onChange={(event) => setBackup(event.target.value)}>
                      {PROVIDER_OPTIONS.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="throttle-grid">
                    <label>
                      Alert throttle (max alerts)
                      <input
                        type="number"
                        min={1}
                        value={maxAlerts}
                        onChange={(event) => setMaxAlerts(Number(event.target.value))}
                      />
                    </label>
                    <label>
                      Window (seconds)
                      <input
                        type="number"
                        min={10}
                        value={windowSeconds}
                        onChange={(event) => setWindowSeconds(Number(event.target.value))}
                      />
                    </label>
                  </div>
                  <div className="flags-grid">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={alertingEnabled}
                        onChange={(event) => setAlertingEnabled(event.target.checked)}
                      />
                      <span>Enable alerting</span>
                    </label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={sandboxMode}
                        onChange={(event) => setSandboxMode(event.target.checked)}
                      />
                      <span>Sandbox mode</span>
                    </label>
                  </div>
                  <button type="submit">Save configuration</button>
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
