import { useMonitoringSnapshot } from "../hooks/useMonitoringSnapshot";

export function AdminMonitoringPage() {
  const { snapshot, loading, error } = useMonitoringSnapshot();

  if (loading) {
    return (
      <section className="page">
        <div className="card">Loading monitoring data…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="card error">Failed to load monitoring: {error}</div>
      </section>
    );
  }

  if (!snapshot) {
    return null;
  }

  return (
    <section className="page" aria-label="Admin Monitoring">
      <div className="card">
        <h2>Worker latency (ms)</h2>
        <p className="muted">p95 latency for recent polling windows.</p>
        <ul className="metric-list">
          {snapshot.latencyMs.map((value, index) => (
            <li key={`latency-${index}`}>Window {index + 1}: {value}ms</li>
          ))}
        </ul>
      </div>
      <div className="card">
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
      <div className="card">
        <h2>Database lag</h2>
        <p>{snapshot.dbLagMs} ms</p>
      </div>
    </section>
  );
}
