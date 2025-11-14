import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminMonitoringPage } from "../pages/AdminMonitoringPage";
import { useMonitoringSnapshot } from "../hooks/useMonitoringSnapshot";

vi.mock("../hooks/useMonitoringSnapshot");
const mockedHook = vi.mocked(useMonitoringSnapshot);

describe("AdminMonitoringPage", () => {
  beforeEach(() => {
    mockedHook.mockReturnValue({
      loading: false,
      error: null,
      snapshot: {
        latencyMs: [100],
        throughputPerMin: [200],
        errorRate: [1],
        dbLagMs: 50,
      },
    });
  });

  it("renders monitoring metrics", () => {
    render(<AdminMonitoringPage />);
    expect(screen.getByText(/Worker latency/)).toBeInTheDocument();
    expect(screen.getByText(/100ms/)).toBeInTheDocument();
  });
});
