import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getUserSettings,
  updateUserSettings,
  getUserPreferences,
  updateUserPreferences,
} from "../api/userSettings";
import type { UserSettings, NotificationPreferences } from "../api/userSettings";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("User Settings API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("getUserSettings", () => {
    it("should fetch and return user settings", async () => {
      const mockSettings: UserSettings = {
        userId: "user123",
        refreshIntervalMinutes: 10,
        cacheStaleTimeMinutes: 5,
        cacheGcTimeMinutes: 10,
        newsFavoriteSymbols: ["AAPL", "MSFT"],
        updatedAt: "2025-01-20T10:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockSettings,
      });

      const result = await getUserSettings();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/api/settings"),
        expect.any(Object)
      );
      expect(result).toEqual(mockSettings);
    });

    it("should return default settings when user not found (404)", async () => {
      // userRequest with allow404=true returns null on 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "not found",
      });

      const result = await getUserSettings();

      expect(result).toEqual({
        userId: "",
        refreshIntervalMinutes: 5,
        cacheStaleTimeMinutes: 5,
        cacheGcTimeMinutes: 10,
        newsFavoriteSymbols: [],
        updatedAt: expect.any(String),
      });
    });

    it("should handle missing cache settings with defaults", async () => {
      const mockSettings = {
        userId: "user123",
        refreshIntervalMinutes: 10,
        updatedAt: "2025-01-20T10:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockSettings,
      });

      const result = await getUserSettings("user123");

      expect(result.cacheStaleTimeMinutes).toBe(5);
      expect(result.cacheGcTimeMinutes).toBe(10);
      expect(result.newsFavoriteSymbols).toEqual([]);
    });

    it("should handle network errors gracefully", async () => {
      // userRequest with allow404=true treats network errors as 404
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

      const result = await getUserSettings();

      expect(result).toEqual({
        userId: "",
        refreshIntervalMinutes: 5,
        cacheStaleTimeMinutes: 5,
        cacheGcTimeMinutes: 10,
        newsFavoriteSymbols: [],
        updatedAt: expect.any(String),
      });
    });
  });

  describe("updateUserSettings", () => {
    it("should update user settings with all fields", async () => {
      const updateRequest = {
        refreshIntervalMinutes: 15,
        cacheStaleTimeMinutes: 8,
        cacheGcTimeMinutes: 15,
      };

      const mockResponse = {
        success: true,
        message: "Settings updated",
        settings: {
          ...updateRequest,
          updatedAt: "2025-01-20T10:00:00Z",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const result = await updateUserSettings(updateRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/api/settings"),
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateRequest),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should update user settings with only refresh interval", async () => {
      const updateRequest = {
        refreshIntervalMinutes: 20,
      };

      const mockResponse = {
        success: true,
        settings: {
          userId: "user123",
          refreshIntervalMinutes: 20,
          cacheStaleTimeMinutes: 5,
          cacheGcTimeMinutes: 10,
          updatedAt: "2025-01-20T10:00:00Z",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const result = await updateUserSettings(updateRequest);

      expect(result.success).toBe(true);
      expect(result.settings?.refreshIntervalMinutes).toBe(20);
    });

    it("should throw error on failed request", async () => {
      const updateRequest = {
        refreshIntervalMinutes: 15,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid refresh interval" }),
      });

      await expect(updateUserSettings(updateRequest)).rejects.toThrow();
    });
  });

  describe("getUserPreferences", () => {
    it("should fetch and return user preferences", async () => {
      const mockPreferences: NotificationPreferences = {
        userId: "user123",
        enabled: true,
        quietStart: "22:00",
        quietEnd: "08:00",
        allowedSymbols: ["AAPL", "MSFT"],
        maxDaily: 10,
        updatedAt: "2025-01-20T10:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockPreferences,
      });

      const result = await getUserPreferences();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/api/preferences"),
        expect.any(Object)
      );
      expect(result).toEqual(mockPreferences);
    });

    it("should return default preferences when user not found", async () => {
      // userRequest with allow404=true returns null on 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "not found",
      });

      const result = await getUserPreferences();

      expect(result).toEqual({
        userId: "",
        enabled: true,
        quietStart: null,
        quietEnd: null,
        allowedSymbols: null,
        maxDaily: null,
        updatedAt: expect.any(String),
      });
    });
  });

  describe("updateUserPreferences", () => {
    it("should update user preferences", async () => {
      const updateRequest = {
        enabled: true,
        quietStart: "22:00",
        quietEnd: "08:00",
        allowedSymbols: ["AAPL", "TSLA"],
        maxDaily: 15,
      };

      const mockResponse = {
        success: true,
        message: "Preferences updated",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => mockResponse,
      });

      const result = await updateUserPreferences(updateRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/api/preferences"),
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateRequest),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failed request", async () => {
      const updateRequest = {
        enabled: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      await expect(updateUserPreferences(updateRequest)).rejects.toThrow();
    });
  });
});

