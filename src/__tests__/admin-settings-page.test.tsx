import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { useAdminConfig } from "../hooks/useAdminConfig";

vi.mock("../hooks/useAdminConfig");
const mockedHook = vi.mocked(useAdminConfig);

describe("AdminSettingsPage", () => {
  beforeEach(() => {
    mockedHook.mockReturnValue({
      loading: false,
      error: null,
      config: {
        pollingIntervalSec: 30,
        primaryProvider: "alpha-feed",
        backupProvider: "beta-feed",
        alertThrottle: { maxAlerts: 100, windowSeconds: 60 },
        featureFlags: { alerting: true, sandboxMode: false },
      },
      saveConfig: vi.fn(),
    });
  });

  it("renders form controls", () => {
    render(<AdminSettingsPage />);
    expect(screen.getByLabelText(/Price polling interval/)).toHaveValue(30);
    expect(screen.getByLabelText(/Primary quote provider/)).toHaveValue("alpha-feed");
  });

  it("submits updated values", () => {
    const mockSave = vi.fn();
    mockedHook.mockReturnValue({
      loading: false,
      error: null,
      config: {
        pollingIntervalSec: 30,
        primaryProvider: "alpha-feed",
        backupProvider: "beta-feed",
        alertThrottle: { maxAlerts: 100, windowSeconds: 60 },
        featureFlags: { alerting: true, sandboxMode: false },
      },
      saveConfig: mockSave,
    });

    render(<AdminSettingsPage />);
    fireEvent.change(screen.getByLabelText(/Price polling interval/), { target: { value: "45" } });
    fireEvent.click(screen.getByText(/Save configuration/));
    return waitFor(() => expect(mockSave).toHaveBeenCalled());
  });
});
