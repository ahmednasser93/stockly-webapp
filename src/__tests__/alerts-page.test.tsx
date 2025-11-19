import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertsPage } from "../pages/AlertsPage";
import * as alertsApi from "../api/alerts";
import * as clientApi from "../api/client";
import axios from "axios";
import type { Alert } from "../types";

// Mock the API modules
vi.mock("../api/alerts");
vi.mock("../api/client");
vi.mock("axios");

const mockListAlerts = vi.mocked(alertsApi.listAlerts);
const mockFetchStocks = vi.mocked(clientApi.fetchStocks);

describe("AlertsPage", () => {
  let queryClient: QueryClient;

  const mockAlerts: Alert[] = [
    {
      id: "1",
      symbol: "AAPL",
      direction: "above",
      threshold: 200.5,
      status: "active",
      channel: "notification",
      target: "dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      notes: "Watch for breakout",
      createdAt: "2025-11-14T10:30:00.000Z",
      updatedAt: "2025-11-14T10:30:00.000Z",
    },
    {
      id: "2",
      symbol: "MSFT",
      direction: "below",
      threshold: 350.0,
      status: "paused",
      channel: "notification",
      target: "eYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
      notes: null,
      createdAt: "2025-11-13T08:20:00.000Z",
      updatedAt: "2025-11-14T12:00:00.000Z",
    },
  ];

  const mockStockPrices = [
    {
      symbol: "AAPL",
      price: 195.5,
      dayLow: 193.0,
      dayHigh: 197.0,
      volume: 50000000,
      timestamp: Date.now(),
    },
    {
      symbol: "MSFT",
      price: 360.0,
      dayLow: 358.0,
      dayHigh: 365.0,
      volume: 30000000,
      timestamp: Date.now(),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockListAlerts.mockResolvedValue(mockAlerts);
    mockFetchStocks.mockResolvedValue(mockStockPrices);
    
    // Reset axios mocks
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.post).mockReset();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  it("should render loading state initially", () => {
    mockListAlerts.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<AlertsPage />);

    expect(screen.getByText(/loading alerts/i)).toBeInTheDocument();
  });

  it("should render alerts table with data", async () => {
    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("MSFT")).toBeInTheDocument();
    });

    // Check for direction indicators
    expect(screen.getByText("↑ Above")).toBeInTheDocument();
    expect(screen.getByText("↓ Below")).toBeInTheDocument();

    // Check for status badges
    expect(screen.getByText("🟢 Active")).toBeInTheDocument();
    expect(screen.getByText("⏸️ Paused")).toBeInTheDocument();
  });

  it("should display empty state when no alerts", async () => {
    mockListAlerts.mockResolvedValue([]);

    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no alerts configured/i)).toBeInTheDocument();
    });
  });

  it("should render error state on API failure", async () => {
    mockListAlerts.mockRejectedValue(new Error("Network error"));

    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText(/error loading alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("should display current prices for symbols", async () => {
    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("$195.50")).toBeInTheDocument();
      expect(screen.getByText("$360.00")).toBeInTheDocument();
    });
  });

  it("should display threshold prices", async () => {
    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("$200.50")).toBeInTheDocument();
      expect(screen.getByText("$350.00")).toBeInTheDocument();
    });
  });

  it("should show filter tabs with correct counts", async () => {
    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText(/all \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/active \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/paused \(1\)/i)).toBeInTheDocument();
    });
  });

  it("should display Create Alert button", async () => {
    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      const createButtons = screen.getAllByText(/create alert/i);
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  it("should show channel badges", async () => {
    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      const notificationBadges = screen.getAllByText(/Mobile Notification/i);
      expect(notificationBadges.length).toBeGreaterThan(0);
      // Verify all alerts show the notification channel
      expect(notificationBadges.length).toBe(2); // 2 alerts in mock data
    });
  });

  it("should render Devices tab", async () => {
    const mockedAxios = vi.mocked(axios);
    mockedAxios.get.mockResolvedValueOnce({
      data: { devices: [] },
    });

    renderWithProviders(<AlertsPage />);

    await waitFor(() => {
      const devicesTab = screen.getByText("Devices");
      expect(devicesTab).toBeInTheDocument();
    });
  });

  it("should load and display devices when Devices tab is clicked", async () => {
    const mockDevices = [
      {
        userId: "user-1",
        pushToken: "dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        deviceInfo: "Android Device",
        createdAt: "2025-11-14T10:30:00.000Z",
        updatedAt: "2025-11-14T10:30:00.000Z",
      },
      {
        userId: "user-2",
        pushToken: "eYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
        deviceInfo: null,
        createdAt: "2025-11-13T08:20:00.000Z",
        updatedAt: "2025-11-14T12:00:00.000Z",
      },
    ];

    // Mock axios.get to handle both alerts and devices endpoints
    // Need to match the actual API_BASE_URL pattern used in AlertsPage
    vi.mocked(axios.get).mockImplementation((url: string | unknown) => {
      const urlStr = typeof url === "string" ? url : url?.url || String(url);
      if (urlStr.includes("/devices")) {
        return Promise.resolve({ data: { devices: mockDevices } });
      }
      if (urlStr.includes("/alerts")) {
        return Promise.resolve({ data: { alerts: mockAlerts } });
      }
      if (urlStr.includes("/get-stocks")) {
        return Promise.resolve({ data: mockStockPrices });
      }
      // Default fallback for other calls
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<AlertsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Click on Devices tab
    const devicesTab = screen.getByText("Devices");
    devicesTab.click();

    await waitFor(() => {
      expect(screen.getByText("user-1")).toBeInTheDocument();
      expect(screen.getByText("user-2")).toBeInTheDocument();
      expect(screen.getByText("Android Device")).toBeInTheDocument();
      expect(screen.getByText("No info")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("should show empty state when no devices are registered", async () => {
    const mockedAxios = vi.mocked(axios);
    
    // Mock axios.get to handle both alerts and devices endpoints
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/devices")) {
        return Promise.resolve({ data: { devices: [] } });
      }
      if (url.includes("/alerts")) {
        return Promise.resolve({ data: { alerts: mockAlerts } });
      }
      if (url.includes("/get-stocks")) {
        return Promise.resolve({ data: mockStockPrices });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithProviders(<AlertsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Click on Devices tab
    const devicesTab = screen.getByText("Devices");
    devicesTab.click();

    await waitFor(() => {
      expect(screen.getByText(/no devices registered/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("should send test notification when Send Test button is clicked", async () => {
    const mockedAxios = vi.mocked(axios);
    const mockDevices = [
      {
        userId: "user-1",
        pushToken: "dXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        deviceInfo: "Android Device",
        createdAt: "2025-11-14T10:30:00.000Z",
        updatedAt: "2025-11-14T10:30:00.000Z",
      },
    ];

    // Mock axios.get to handle both alerts and devices endpoints
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes("/devices")) {
        return Promise.resolve({ data: { devices: mockDevices } });
      }
      if (url.includes("/alerts")) {
        return Promise.resolve({ data: { alerts: mockAlerts } });
      }
      if (url.includes("/get-stocks")) {
        return Promise.resolve({ data: mockStockPrices });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: "Test notification sent successfully" },
    });

    renderWithProviders(<AlertsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Click on Devices tab
    const devicesTab = screen.getByText("Devices");
    devicesTab.click();

    await waitFor(() => {
      expect(screen.getByText("user-1")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click Test button
    const sendTestButton = screen.getByText("Test");
    sendTestButton.click();

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/devices/user-1/test"),
        {},
        expect.objectContaining({ headers: { "Content-Type": "application/json" } })
      );
    });
  });
});

