import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listAlerts,
  getAlert,
  createAlert,
  updateAlert,
  deleteAlert,
} from "../api/alerts";
import type { Alert, CreateAlertRequest, UpdateAlertRequest } from "../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Alerts API Client", () => {
  const mockAlert: Alert = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    symbol: "AAPL",
    direction: "above",
    threshold: 200.5,
    status: "active",
    channel: "notification",
    target: "dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    notes: "Watch for breakout",
    createdAt: "2025-11-14T10:30:00.000Z",
    updatedAt: "2025-11-14T10:30:00.000Z",
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("listAlerts", () => {
    it("should fetch and return list of alerts", async () => {
      const mockResponse = { alerts: [mockAlert] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await listAlerts();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/api/alerts")
      );
      expect(result).toEqual([mockAlert]);
    });

    it("should return empty array when no alerts", async () => {
      const mockResponse = { alerts: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await listAlerts();

      expect(result).toEqual([]);
    });

    it("should throw error on failed request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      await expect(listAlerts()).rejects.toThrow("Internal server error");
    });
  });

  describe("getAlert", () => {
    it("should fetch and return single alert", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlert,
      });

      const result = await getAlert(mockAlert.id);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/api/alerts/${mockAlert.id}`)
      );
      expect(result).toEqual(mockAlert);
    });

    it("should throw error when alert not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "alert not found" }),
      });

      await expect(getAlert("invalid-id")).rejects.toThrow("alert not found");
    });
  });

  describe("createAlert", () => {
    it("should create alert and return created alert", async () => {
      const createRequest: CreateAlertRequest = {
        symbol: "AAPL",
        direction: "above",
        threshold: 200.5,
        channel: "notification",
        target: "dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        notes: "Watch for breakout",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockAlert,
      });

      const result = await createAlert(createRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/api/alerts"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createRequest),
        })
      );
      expect(result).toEqual(mockAlert);
    });

    it("should throw validation error on invalid data", async () => {
      const createRequest: CreateAlertRequest = {
        symbol: "AAPL",
        direction: "above",
        threshold: -100, // Invalid negative threshold
        channel: "notification",
        target: "dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "threshold must be positive" }),
      });

      await expect(createAlert(createRequest)).rejects.toThrow(
        "threshold must be positive"
      );
    });
  });

  describe("updateAlert", () => {
    it("should update alert and return updated alert", async () => {
      const updateRequest: UpdateAlertRequest = {
        threshold: 210.0,
        status: "paused",
      };

      const updatedAlert = { ...mockAlert, ...updateRequest };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedAlert,
      });

      const result = await updateAlert(mockAlert.id, updateRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/api/alerts/${mockAlert.id}`),
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateRequest),
        })
      );
      expect(result).toEqual(updatedAlert);
    });

    it("should throw error when alert not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "alert not found" }),
      });

      await expect(
        updateAlert("invalid-id", { threshold: 210 })
      ).rejects.toThrow("alert not found");
    });

    it("should throw error when no fields provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "at least one field must be provided" }),
      });

      await expect(updateAlert(mockAlert.id, {})).rejects.toThrow(
        "at least one field must be provided"
      );
    });
  });

  describe("deleteAlert", () => {
    it("should delete alert and return success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await deleteAlert(mockAlert.id);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/api/alerts/${mockAlert.id}`),
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(result).toEqual({ success: true });
    });

    it("should throw error when alert not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "alert not found" }),
      });

      await expect(deleteAlert("invalid-id")).rejects.toThrow(
        "alert not found"
      );
    });
  });
});

