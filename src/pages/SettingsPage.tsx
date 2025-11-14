import { useState } from "react";
import { useSettings } from "../state/SettingsContext";

export function SettingsPage() {
  const { refreshInterval, updateRefreshInterval } = useSettings();
  const [value, setValue] = useState(refreshInterval.toString());

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    updateRefreshInterval(parsed);
  };

  return (
    <section className="page">
      <div className="card">
        <h2>Settings</h2>
        <form onSubmit={handleSubmit} className="settings-form">
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
    </section>
  );
}
