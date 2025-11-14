import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://stockly-api.ahmednasser1993.workers.dev");

interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  quietStart?: string | null;
  quietEnd?: string | null;
  allowedSymbols?: string[] | null;
  maxDaily?: number | null;
  updatedAt: string;
}

export function PreferencesPage() {
  const [userId] = useState("demo-user"); // In real app, get from auth context
  const [, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [maxDaily, setMaxDaily] = useState("");
  const [allowedSymbols, setAllowedSymbols] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/v1/api/preferences/${userId}`);
      const prefs = response.data as NotificationPreferences;
      setPreferences(prefs);
      
      // Update form state
      setEnabled(prefs.enabled);
      setQuietStart(prefs.quietStart || "");
      setQuietEnd(prefs.quietEnd || "");
      setMaxDaily(prefs.maxDaily ? String(prefs.maxDaily) : "");
      setAllowedSymbols(prefs.allowedSymbols ? prefs.allowedSymbols.join(", ") : "");
    } catch (err: any) {
      // If it's a network error or 500, show error
      if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) {
        const errorMessage = err?.response?.data?.error || err?.message || "Failed to load preferences";
        setError(`Failed to load preferences: ${errorMessage}`);
        console.error("Preferences load error:", err);
      } else {
        // For 404 or other client errors, just use defaults (no error shown)
        setError(null);
        console.log("No preferences found, using defaults");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const symbolsArray = allowedSymbols
        ? allowedSymbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
        : null;

      const payload = {
        userId,
        enabled,
        quietStart: quietStart || null,
        quietEnd: quietEnd || null,
        maxDaily: maxDaily ? parseInt(maxDaily, 10) : null,
        allowedSymbols: symbolsArray,
      };

      await axios.put(`${API_BASE_URL}/v1/api/preferences`, payload);
      setSuccessMessage("Preferences saved successfully!");
      await loadPreferences();
    } catch (err) {
      setError("Failed to save preferences");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="card">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading preferences...</p>
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
            <h1>Notification Preferences</h1>
            <p className="muted">
              Customize how and when you receive push notifications
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px" }}>
            <p style={{ color: "#f87171", margin: 0 }}>❌ {error}</p>
          </div>
        )}

        {successMessage && (
          <div className="success-banner" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "8px" }}>
            <p style={{ color: "#38bdf8", margin: 0 }}>✅ {successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
              disabled={saving}
              style={{ background: "transparent", border: "1px solid var(--ghost-border)" }}
            >
              Reset
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

