import { MonitoringSection } from "../components/MonitoringSection";

export function MonitoringPage() {
  return (
    <section className="page">
      <div className="card">
        <div className="alerts-header">
          <div>
            <h1>Monitoring</h1>
            <p className="muted">
              Monitor alerts, notifications, devices, and users across the system
            </p>
          </div>
        </div>
        <MonitoringSection />
      </div>
    </section>
  );
}

