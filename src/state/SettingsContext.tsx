import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Constants - fast refresh warning suppressed as these are needed in this file
/* eslint-disable react-refresh/only-export-components */
export const SETTINGS_STORAGE_KEY = "stockly-webapp-settings";
export const DEFAULT_REFRESH_SECONDS = 30;

type SettingsContextValue = {
  refreshInterval: number;
  updateRefreshInterval: (seconds: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

type StoredSettings = {
  refreshInterval: number;
};

export function SettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed: StoredSettings = JSON.parse(stored);
        if (parsed?.refreshInterval) {
          return parsed.refreshInterval;
        }
      }
    } catch (err) {
      console.warn("Failed to parse saved settings", err);
    }
    return DEFAULT_REFRESH_SECONDS;
  });

  useEffect(() => {
    const payload: StoredSettings = { refreshInterval };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }, [refreshInterval]);

  const updateRefreshInterval = (seconds: number) => {
    const clamped = Math.max(5, Math.min(600, Math.round(seconds)));
    setRefreshInterval(clamped);
  };

  const value = useMemo(
    () => ({ refreshInterval, updateRefreshInterval }),
    [refreshInterval]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
/* eslint-enable react-refresh/only-export-components */
