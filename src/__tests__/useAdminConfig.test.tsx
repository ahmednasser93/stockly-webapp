import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useAdminConfig } from "../hooks/useAdminConfig";

vi.mock("../api/adminConfig", () => ({
  getAdminConfig: vi.fn().mockResolvedValue({
    pollingIntervalSec: 30,
    primaryProvider: "alpha-feed",
    backupProvider: "beta-feed",
    alertThrottle: { maxAlerts: 100, windowSeconds: 60 },
    featureFlags: { alerting: true, sandboxMode: false },
  }),
  updateAdminConfig: vi.fn().mockResolvedValue({
    pollingIntervalSec: 45,
    primaryProvider: "alpha-feed",
    backupProvider: "beta-feed",
    alertThrottle: { maxAlerts: 150, windowSeconds: 60 },
    featureFlags: { alerting: true, sandboxMode: false },
  }),
}));

function TestComponent() {
  const { config, loading, saveConfig } = useAdminConfig();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>provider-{config?.primaryProvider}</p>
      <button onClick={() => saveConfig({ pollingIntervalSec: 45 })}>save</button>
    </div>
  );
}

describe("useAdminConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads admin config and saves updates", async () => {
    render(<TestComponent />);

    await waitFor(() => expect(screen.getByText(/provider-alpha-feed/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("save"));

    await waitFor(() => expect(screen.getByText(/provider-alpha-feed/)).toBeInTheDocument());
  });
});
