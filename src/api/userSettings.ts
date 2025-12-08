// Use localhost in development, production URL in builds
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://stockly-api.ahmednasser1993.workers.dev");

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

async function userRequest<T>(path: string, init?: RequestInit, allow404 = false): Promise<T | null> {
  const url = `${API_BASE_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      ...init,
    });
    
    // Handle 404 as expected for new users (return null to use defaults)
    if (response.status === 404 && allow404) {
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `User API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Handle empty responses (204 No Content)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return {} as T;
    }
    
    return (await response.json()) as T;
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      // If 404 is allowed, treat network errors as "not found" for graceful degradation
      if (allow404) {
        console.warn(`Network error accessing ${url}, treating as not found (using defaults)`);
        return null;
      }
      throw new Error(`Failed to fetch: Network error or CORS issue. Check if ${url} is accessible.`);
    }
    throw error;
  }
}

export type UserSettings = {
  userId: string;
  refreshIntervalMinutes: number;
  cacheStaleTimeMinutes?: number;
  cacheGcTimeMinutes?: number;
  newsFavoriteSymbols?: string[];
  updatedAt: string;
};

export type UpdateUserSettingsRequest = {
  userId: string;
  refreshIntervalMinutes: number;
  cacheStaleTimeMinutes?: number;
  cacheGcTimeMinutes?: number;
};

export type NotificationPreferences = {
  userId: string;
  enabled: boolean;
  quietStart: string | null;
  quietEnd: string | null;
  allowedSymbols: string[] | null;
  maxDaily: number | null;
  updatedAt: string;
};

export type UpdatePreferencesRequest = {
  userId: string;
  enabled: boolean;
  quietStart?: string | null;
  quietEnd?: string | null;
  allowedSymbols?: string[] | null;
  maxDaily?: number | null;
};

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  settings?: T;
  [key: string]: unknown;
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const result = await userRequest<UserSettings>(`/v1/api/settings/${userId}`, undefined, true);
  if (result === null) {
    // Return default settings for new users
    return {
      userId,
      refreshIntervalMinutes: 5,
      cacheStaleTimeMinutes: 5,
      cacheGcTimeMinutes: 10,
      newsFavoriteSymbols: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    ...result,
    cacheStaleTimeMinutes: result.cacheStaleTimeMinutes ?? 5,
    cacheGcTimeMinutes: result.cacheGcTimeMinutes ?? 10,
    newsFavoriteSymbols: result.newsFavoriteSymbols ?? [],
  };
}

export async function updateUserSettings(
  request: UpdateUserSettingsRequest
): Promise<ApiResponse<UserSettings>> {
  const result = await userRequest<ApiResponse<UserSettings>>("/v1/api/settings", {
    method: "PUT",
    body: JSON.stringify(request),
  });
  if (result === null) {
    throw new Error("Failed to update user settings");
  }
  return result;
}

export async function getUserPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const result = await userRequest<NotificationPreferences>(`/v1/api/preferences/${userId}`, undefined, true);
  if (result === null) {
    // Return default preferences for new users
    return {
      userId,
      enabled: true,
      quietStart: null,
      quietEnd: null,
      allowedSymbols: null,
      maxDaily: null,
      updatedAt: new Date().toISOString(),
    };
  }
  return result;
}

export async function updateUserPreferences(
  request: UpdatePreferencesRequest
): Promise<ApiResponse<void>> {
  const result = await userRequest<ApiResponse<void>>("/v1/api/preferences", {
    method: "PUT",
    body: JSON.stringify(request),
  });
  if (result === null) {
    throw new Error("Failed to update user preferences");
  }
  return result;
}

/**
 * Update news favorite symbols for a user
 * Uses POST /v1/api/users/preferences/update endpoint
 */
export async function updateNewsFavoriteSymbols(
  userId: string,
  newsFavoriteSymbols: string[]
): Promise<ApiResponse<void>> {
  const result = await userRequest<ApiResponse<void>>("/v1/api/users/preferences/update", {
    method: "POST",
    body: JSON.stringify({
      userId,
      newsFavoriteSymbols,
    }),
  });
  if (result === null) {
    throw new Error("Failed to update news favorite symbols");
  }
  return result;
}

