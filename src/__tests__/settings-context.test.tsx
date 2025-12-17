import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import { SettingsProvider, useSettings } from "../state/SettingsContext";

function SettingsConsumer() {
  const {
    refreshInterval,
    cacheStaleTimeMinutes,
    cacheGcTimeMinutes,
    updateRefreshInterval,
    updateCacheStaleTime,
    updateCacheGcTime,
  } = useSettings();
  return (
    <div>
      <span data-testid="interval">{refreshInterval}</span>
      <span data-testid="stale-time">{cacheStaleTimeMinutes}</span>
      <span data-testid="gc-time">{cacheGcTimeMinutes}</span>
      <button onClick={() => updateRefreshInterval(refreshInterval + 5)}>Bump Interval</button>
      <button onClick={() => updateCacheStaleTime(cacheStaleTimeMinutes + 1)}>Bump Stale</button>
      <button onClick={() => updateCacheGcTime(cacheGcTimeMinutes + 2)}>Bump GC</button>
    </div>
  );
}

describe("SettingsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default values", () => {
    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    expect(screen.getByTestId("interval")).toHaveTextContent("30");
    expect(screen.getByTestId("stale-time")).toHaveTextContent("5");
    expect(screen.getByTestId("gc-time")).toHaveTextContent("10");
  });

  it("persists refresh interval changes", () => {
    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    const interval = screen.getByTestId("interval");
    expect(interval).toHaveTextContent("30");

    fireEvent.click(screen.getByText("Bump Interval"));
    expect(interval).toHaveTextContent("35");

    const stored = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(stored.refreshInterval).toBe(35);
  });

  it("persists cache stale time changes", () => {
    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    const staleTime = screen.getByTestId("stale-time");
    expect(staleTime).toHaveTextContent("5");

    fireEvent.click(screen.getByText("Bump Stale"));
    expect(staleTime).toHaveTextContent("6");

    const stored = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(stored.cacheStaleTimeMinutes).toBe(6);
  });

  it("persists cache GC time changes", () => {
    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    const gcTime = screen.getByTestId("gc-time");
    expect(gcTime).toHaveTextContent("10");

    fireEvent.click(screen.getByText("Bump GC"));
    expect(gcTime).toHaveTextContent("12");

    const stored = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(stored.cacheGcTimeMinutes).toBe(12);
  });

  it("clamps refresh interval to valid range", () => {
    function ClampTestComponent() {
      const { updateRefreshInterval } = useSettings();
      return (
        <div>
          <button onClick={() => updateRefreshInterval(1)}>Set Min</button>
          <button onClick={() => updateRefreshInterval(1000)}>Set Max</button>
        </div>
      );
    }

    render(
      <SettingsProvider>
        <ClampTestComponent />
      </SettingsProvider>
    );

    // Test minimum (5 seconds)
    fireEvent.click(screen.getByText("Set Min"));
    const storedMin = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(storedMin.refreshInterval).toBe(5);

    // Test maximum (600 seconds)
    fireEvent.click(screen.getByText("Set Max"));
    const storedMax = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(storedMax.refreshInterval).toBe(600);
  });

  it("clamps cache stale time to valid range", () => {
    function ClampStaleTestComponent() {
      const { updateCacheStaleTime } = useSettings();
      return (
        <div>
          <button onClick={() => updateCacheStaleTime(-1)}>Set Min</button>
          <button onClick={() => updateCacheStaleTime(100)}>Set Max</button>
        </div>
      );
    }

    render(
      <SettingsProvider>
        <ClampStaleTestComponent />
      </SettingsProvider>
    );

    // Test minimum (0 minutes)
    fireEvent.click(screen.getByText("Set Min"));
    const storedMin = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(storedMin.cacheStaleTimeMinutes).toBe(0);

    // Test maximum (60 minutes)
    fireEvent.click(screen.getByText("Set Max"));
    const storedMax = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(storedMax.cacheStaleTimeMinutes).toBe(60);
  });

  it("clamps cache GC time to valid range", () => {
    function ClampGcTestComponent() {
      const { updateCacheGcTime } = useSettings();
      return (
        <div>
          <button onClick={() => updateCacheGcTime(0)}>Set Min</button>
          <button onClick={() => updateCacheGcTime(200)}>Set Max</button>
        </div>
      );
    }

    render(
      <SettingsProvider>
        <ClampGcTestComponent />
      </SettingsProvider>
    );

    // Test minimum (1 minute)
    fireEvent.click(screen.getByText("Set Min"));
    const storedMin = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(storedMin.cacheGcTimeMinutes).toBe(1);

    // Test maximum (120 minutes)
    fireEvent.click(screen.getByText("Set Max"));
    const storedMax = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(storedMax.cacheGcTimeMinutes).toBe(120);
  });

  it("loads settings from localStorage on mount", () => {
    const savedSettings = {
      refreshInterval: 60,
      cacheStaleTimeMinutes: 10,
      cacheGcTimeMinutes: 20,
    };
    localStorage.setItem("stockly-webapp-settings", JSON.stringify(savedSettings));

    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    expect(screen.getByTestId("interval")).toHaveTextContent("60");
    expect(screen.getByTestId("stale-time")).toHaveTextContent("10");
    expect(screen.getByTestId("gc-time")).toHaveTextContent("20");
  });

  it("persists all settings together", () => {
    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    fireEvent.click(screen.getByText("Bump Interval"));
    fireEvent.click(screen.getByText("Bump Stale"));
    fireEvent.click(screen.getByText("Bump GC"));

    const stored = JSON.parse(localStorage.getItem("stockly-webapp-settings") || "{}");
    expect(stored).toEqual({
      refreshInterval: 35,
      cacheStaleTimeMinutes: 6,
      cacheGcTimeMinutes: 12,
    });
  });

  it("handles corrupted settings in localStorage", () => {
    // Suppress console.warn for this test
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    localStorage.setItem("stockly-webapp-settings", "invalid-json{");

    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    // Should fall back to defaults
    expect(screen.getByTestId("interval")).toHaveTextContent("30");
    expect(screen.getByTestId("stale-time")).toHaveTextContent("5");
    expect(screen.getByTestId("gc-time")).toHaveTextContent("10");

    consoleSpy.mockRestore();
  });

  it("handles partial settings in localStorage", () => {
    const partial = { refreshInterval: 45 }; // missing other fields
    localStorage.setItem("stockly-webapp-settings", JSON.stringify(partial));

    render(
      <SettingsProvider>
        <SettingsConsumer />
      </SettingsProvider>
    );

    expect(screen.getByTestId("interval")).toHaveTextContent("45");
    // Others should be defaults
    expect(screen.getByTestId("stale-time")).toHaveTextContent("5");
    expect(screen.getByTestId("gc-time")).toHaveTextContent("10");
  });

  it("throws if useSettings is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    expect(() => renderHook(() => useSettings())).toThrow("useSettings must be used within SettingsProvider");

    consoleSpy.mockRestore();
  });
});
