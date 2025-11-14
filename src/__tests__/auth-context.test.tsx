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

  it("falls back to env credentials when /api/login is unavailable", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    const authModule = await import("../state/AuthContext");
    const { AuthProvider, useAuth } = authModule;

    function AuthConsumer() {
      const { isAuthenticated, login, error } = useAuth();
      return (
        <div>
          <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
          <span data-testid="error">{error ?? ""}</span>
          <button onClick={() => login("demo", "demo123")}>Login</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });
    expect(localStorage.getItem("stockly-webapp-auth")).toBe("true");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });
});
