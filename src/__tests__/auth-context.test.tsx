import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

function clearAuthStorage() {
  localStorage.removeItem("stockly-webapp-auth");
}

describe("AuthProvider", () => {
  beforeEach(() => {
    clearAuthStorage();
    vi.stubEnv("VITE_STOCKLY_USERNAME", "demo");
    vi.stubEnv("VITE_STOCKLY_PASS", "demo123");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Note: This test is skipped as we've moved to Google OAuth authentication
  // The old username/password login is no longer supported
  it.skip("falls back to env credentials when /api/login is unavailable", async () => {
    // Test skipped - Google OAuth implementation
  });
});
