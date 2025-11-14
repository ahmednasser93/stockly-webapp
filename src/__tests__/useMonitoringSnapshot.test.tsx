import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useMonitoringSnapshot } from "../hooks/useMonitoringSnapshot";

vi.mock("../api/adminConfig", () => ({
  getMonitoringSnapshot: vi.fn().mockResolvedValue({
    latencyMs: [100],
    throughputPerMin: [200],
    errorRate: [1],
    dbLagMs: 50,
  }),
}));

function SnapshotConsumer() {
  const { snapshot, loading } = useMonitoringSnapshot();
  if (loading) return <p>loading</p>;
  return <p>latency-{snapshot?.latencyMs[0]}</p>;
}

describe("useMonitoringSnapshot", () => {
  it("loads monitoring data", async () => {
    render(<SnapshotConsumer />);
    await waitFor(() => expect(screen.getByText("latency-100")).toBeInTheDocument());
  });
});
