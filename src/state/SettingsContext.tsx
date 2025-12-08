import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Constants - fast refresh warning suppressed as these are needed in this file
/* eslint-disable react-refresh/only-export-components */
export const SETTINGS_STORAGE_KEY = "stockly-webapp-settings";
export const DEFAULT_REFRESH_SECONDS = 30;
export const DEFAULT_STALE_TIME_MINUTES = 5;
export const DEFAULT_GC_TIME_MINUTES = 10;

type SettingsContextValue = {
  refreshInterval: number;
  cacheStaleTimeMinutes: number;
  cacheGcTimeMinutes: number;
  updateRefreshInterval: (seconds: number) => void;
  updateCacheStaleTime: (minutes: number) => void;
  updateCacheGcTime: (minutes: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

type StoredSettings = {
  refreshInterval: number;
  cacheStaleTimeMinutes?: number;
  cacheGcTimeMinutes?: number;
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

  const [cacheStaleTimeMinutes, setCacheStaleTimeMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed: StoredSettings = JSON.parse(stored);
        if (parsed?.cacheStaleTimeMinutes !== undefined) {
          return parsed.cacheStaleTimeMinutes;
        }
      }
    } catch (err) {
      console.warn("Failed to parse saved settings", err);
    }
    return DEFAULT_STALE_TIME_MINUTES;
  });

  const [cacheGcTimeMinutes, setCacheGcTimeMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed: StoredSettings = JSON.parse(stored);
        if (parsed?.cacheGcTimeMinutes !== undefined) {
          return parsed.cacheGcTimeMinutes;
        }
      }
    } catch (err) {
      console.warn("Failed to parse saved settings", err);
    }
    return DEFAULT_GC_TIME_MINUTES;
  });

  useEffect(() => {
    const payload: StoredSettings = { 
      refreshInterval, 
      cacheStaleTimeMinutes, 
      cacheGcTimeMinutes 
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }, [refreshInterval, cacheStaleTimeMinutes, cacheGcTimeMinutes]);

  const updateRefreshInterval = (seconds: number) => {
    const clamped = Math.max(5, Math.min(600, Math.round(seconds)));
    setRefreshInterval(clamped);
  };

  const updateCacheStaleTime = (minutes: number) => {
    const clamped = Math.max(0, Math.min(60, Math.round(minutes)));
    setCacheStaleTimeMinutes(clamped);
  };

  const updateCacheGcTime = (minutes: number) => {
    const clamped = Math.max(1, Math.min(120, Math.round(minutes)));
    setCacheGcTimeMinutes(clamped);
  };

  const value = useMemo(
    () => ({ 
      refreshInterval, 
      cacheStaleTimeMinutes,
      cacheGcTimeMinutes,
      updateRefreshInterval, 
      updateCacheStaleTime,
      updateCacheGcTime,
    }),
    [refreshInterval, cacheStaleTimeMinutes, cacheGcTimeMinutes]
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
