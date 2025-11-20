// Use localhost in development, production URL in builds
const ADMIN_API_BASE = (
  import.meta.env.VITE_ADMIN_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://stockly-api.ahmednasser1993.workers.dev")
).replace(/\/?$/, "");

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${ADMIN_API_BASE}${path}`;
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Admin API error: ${response.status}`);
  }
  return (await response.json()) as T;
}

export type AdminConfig = {
  pollingIntervalSec: number;
  kvWriteIntervalSec: number;
  primaryProvider: string;
  backupProvider: string;
  alertThrottle: {
    maxAlerts: number;
    windowSeconds: number;
  };
  featureFlags: {
    alerting: boolean;
    sandboxMode: boolean;
    simulateProviderFailure: boolean;
  };
};

export type AdminConfigUpdate = Partial<AdminConfig>;

export type MonitoringSnapshot = {
  latencyMs: number[];
  throughputPerMin: number[];
  errorRate: number[];
  dbLagMs: number;
};

const FALLBACK_CONFIG: AdminConfig = {
  pollingIntervalSec: 30,
  kvWriteIntervalSec: 3600,
  primaryProvider: "alpha-feed",
  backupProvider: "beta-feed",
  alertThrottle: { maxAlerts: 100, windowSeconds: 60 },
  featureFlags: { alerting: true, sandboxMode: false, simulateProviderFailure: false },
};

const FALLBACK_METRICS: MonitoringSnapshot = {
  latencyMs: [110, 120, 140, 130],
  throughputPerMin: [200, 230, 240, 220],
  errorRate: [1, 2, 1, 3],
  dbLagMs: 80,
};

export async function getAdminConfig(): Promise<AdminConfig> {
  if (!ADMIN_API_BASE) return FALLBACK_CONFIG;
  try {
    return await adminRequest<AdminConfig>("/config/get");
  } catch (error) {
    console.warn("Falling back to default config", error);
    return FALLBACK_CONFIG;
  }
}

export async function updateAdminConfig(payload: AdminConfigUpdate): Promise<AdminConfig> {
  if (!ADMIN_API_BASE) {
    return { ...FALLBACK_CONFIG, ...payload } as AdminConfig;
  }
  return adminRequest<AdminConfig>("/config/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMonitoringSnapshot(): Promise<MonitoringSnapshot> {
  if (!ADMIN_API_BASE) return FALLBACK_METRICS;
  try {
    return await adminRequest<MonitoringSnapshot>("/monitor/metrics");
  } catch (error) {
    console.warn("Falling back to mock metrics", error);
    return FALLBACK_METRICS;
  }
}

export async function fetchOpenApiSpec(): Promise<Record<string, unknown>> {
  if (!ADMIN_API_BASE) {
    return {
      openapi: "3.0.0",
      info: { title: "Stockly Admin", version: "1.0.0" },
      paths: {},
    };
  }
  const response = await fetch(`${ADMIN_API_BASE}/openapi.json`);
  if (!response.ok) {
    throw new Error("Failed to fetch OpenAPI spec");
  }
  return response.json();
}

export async function simulateProviderFailure(): Promise<AdminConfig> {
  if (!ADMIN_API_BASE) {
    return { ...FALLBACK_CONFIG, featureFlags: { ...FALLBACK_CONFIG.featureFlags, simulateProviderFailure: true } };
  }
  return adminRequest<AdminConfig>("/v1/api/simulate-provider-failure", {
    method: "POST",
  });
}

export async function disableProviderFailure(): Promise<AdminConfig> {
  if (!ADMIN_API_BASE) {
    return { ...FALLBACK_CONFIG, featureFlags: { ...FALLBACK_CONFIG.featureFlags, simulateProviderFailure: false } };
  }
  return adminRequest<AdminConfig>("/v1/api/disable-provider-failure", {
    method: "POST",
  });
}
