import { useEffect, useState } from "react";
import { useAdminConfig } from "../hooks/useAdminConfig";

const PROVIDER_OPTIONS = ["alpha-feed", "beta-feed", "gamma-fallback"];

export function AdminSettingsPage() {
  const { config, loading, error, saveConfig } = useAdminConfig();
  const [polling, setPolling] = useState(30);
  const [primary, setPrimary] = useState(PROVIDER_OPTIONS[0]);
  const [backup, setBackup] = useState(PROVIDER_OPTIONS[1]);
  const [maxAlerts, setMaxAlerts] = useState(100);
  const [windowSeconds, setWindowSeconds] = useState(60);
  const [alertingEnabled, setAlertingEnabled] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!config) return;
    setPolling(config.pollingIntervalSec);
    setPrimary(config.primaryProvider);
    setBackup(config.backupProvider);
    setMaxAlerts(config.alertThrottle.maxAlerts);
    setWindowSeconds(config.alertThrottle.windowSeconds);
    setAlertingEnabled(config.featureFlags.alerting);
    setSandboxMode(config.featureFlags.sandboxMode);
  }, [config]);

  if (loading) {
    return <section className="page"><div className="card">Loading admin config…</div></section>;
  }

  if (error) {
    return (
      <section className="page">
        <div className="card error">Failed to load config: {error}</div>
      </section>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Saving…");
    await saveConfig({
      pollingIntervalSec: polling,
      primaryProvider: primary,
      backupProvider: backup,
      alertThrottle: { maxAlerts, windowSeconds },
      featureFlags: { alerting: alertingEnabled, sandboxMode },
    });
    setStatus("Configuration saved");
  };

  return (
    <section className="page" aria-label="Admin Settings">
      <div className="card">
        <h2>Backend configuration</h2>
        <p className="muted">Adjust polling cadence, provider routing, and feature flags.</p>
        {status && <p className="status-chip">{status}</p>}
        <form className="settings-form" onSubmit={handleSubmit}>
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
      </div>
    </section>
  );
}
