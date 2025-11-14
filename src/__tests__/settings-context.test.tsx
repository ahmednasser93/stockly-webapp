import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsProvider, useSettings } from "../state/SettingsContext";

function SettingsConsumer() {
  const { refreshInterval, updateRefreshInterval } = useSettings();
  return (
    <div>
      <span data-testid="interval">{refreshInterval}</span>
      <button onClick={() => updateRefreshInterval(refreshInterval + 5)}>Bump</button>
    </div>
  );
}

describe("SettingsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists refresh interval changes", () => {
    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    const interval = screen.getByTestId("interval");
    expect(interval).toHaveTextContent("30");

    fireEvent.click(screen.getByText("Bump"));
    expect(interval).toHaveTextContent("35");

    const stored = localStorage.getItem("stockly-webapp-settings");
    expect(stored).toBe(JSON.stringify({ refreshInterval: 35 }));
  });
});
