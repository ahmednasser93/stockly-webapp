import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserDetailPage } from "../pages/UserDetailPage";
import * as useAlertsModule from "../hooks/useAlerts";
import { axiosClient } from "../api/axios-client";

vi.mock("../api/axios-client");
vi.mock("../api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/client")>();
  return {
    ...actual,
    fetchStocks: vi.fn(() => Promise.resolve([])),
  };
});

const mockAxiosClient = vi.mocked(axiosClient);

const renderWithProviders = (ui: React.ReactElement, initialEntries = ["/monitoring/users/testuser"]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("UserDetailPage", () => {
  const mockUseAlerts = {
    alerts: [],
    isLoading: false,
    isError: false,
    createAlert: vi.fn(),
    updateAlert: vi.fn(),
    deleteAlert: vi.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    createError: null,
    updateError: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useAlertsModule, "useAlerts").mockReturnValue(mockUseAlerts as ReturnType<typeof useAlertsModule.useAlerts>);
    mockAxiosClient.get.mockResolvedValue({
      data: {
        users: [
          {
            username: "testuser",
            stocks: ["AAPL", "MSFT"],
          },
        ],
        devices: [
          {
            username: "testuser",
            pushToken: "test-token-123",
            deviceInfo: '{"platform": "Android", "model": "Pixel 5"}',
            deviceType: null,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ],
      },
    });
  });

  it.skip("renders loading state initially", async () => {
    mockAxiosClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<UserDetailPage />);

    expect(screen.getByText("Loading user data...")).toBeInTheDocument();
  });

  it.skip("renders user information when loaded", async () => {
    renderWithProviders(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("User Overview")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it.skip("displays favorite stocks", async () => {
    renderWithProviders(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Favorite Stocks")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
  });

  it.skip("displays devices", async () => {
    renderWithProviders(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Devices/)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Android Pixel 5/i)).toBeInTheDocument();
  });

  it.skip("shows empty states when no data", async () => {
    mockAxiosClient.get.mockResolvedValue({
      data: {
        users: [
          {
            username: "testuser",
            stocks: [],
          },
        ],
        devices: [],
      },
    });

    renderWithProviders(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("No favorite stocks")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText("No alerts configured")).toBeInTheDocument();
    expect(screen.getByText("No devices registered")).toBeInTheDocument();
  });

  it.skip("displays error message when user not found", async () => {
    mockAxiosClient.get.mockResolvedValue({
      data: {
        users: [],
        devices: [],
      },
    });

    renderWithProviders(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/User not found/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it.skip("renders back button", async () => {
    renderWithProviders(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Back to Monitoring")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it.skip("displays stats cards", async () => {
    renderWithProviders(<UserDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Favorite Stocks")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that stats sections are rendered
    expect(screen.getByText(/Alerts/)).toBeInTheDocument();
    expect(screen.getByText(/Devices/)).toBeInTheDocument();
  });
});

