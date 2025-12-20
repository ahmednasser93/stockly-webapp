import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { MonitoringSection } from "../components/MonitoringSection";
import * as alertsApi from "../hooks/useAlerts";
import { axiosClient } from "../api/axios-client";

vi.mock("../hooks/useAlerts");
vi.mock("../api/axios-client");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const mockUseAlertsReturn: ReturnType<typeof alertsApi.useAlerts> = {
  alerts: [],
  isLoading: false,
  isError: false,
  error: null,
  createAlert: vi.fn(),
  updateAlert: vi.fn(),
  deleteAlert: vi.fn(),
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createError: null,
  updateError: null,
  deleteError: null,
  refetch: vi.fn(),
};

describe("MonitoringSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(alertsApi.useAlerts).mockReturnValue(mockUseAlertsReturn);

    vi.mocked(axiosClient.get).mockResolvedValue({
      data: { users: [] },
    } as { data: { users: unknown[] } });
  });

  it("renders monitoring section with tabs", () => {
    render(<MonitoringSection />, { wrapper: createWrapper() });

    expect(screen.getByText("Alerts Logs")).toBeInTheDocument();
    expect(screen.getByText("Notification Logs")).toBeInTheDocument();
    expect(screen.getByText("Devices")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("defaults to users tab", () => {
    render(<MonitoringSection />, { wrapper: createWrapper() });

    const usersTab = screen.getByText("Users").closest("button");
    expect(usersTab).toHaveClass("active");
  });

  it("switches tabs when clicked", async () => {
    render(<MonitoringSection />, { wrapper: createWrapper() });

    const alertsTab = screen.getByText("Alerts Logs");
    alertsTab.click();

    await waitFor(() => {
      expect(alertsTab.closest("button")).toHaveClass("active");
    });
  });

  it("loads users data when users tab is active", async () => {
    const mockUsers = [
      {
        username: "user1",
        stocks: ["AAPL"],
        count: 1,
      },
    ];

    vi.mocked(axiosClient.get).mockResolvedValue({
      data: { users: mockUsers },
    } as { data: { users: unknown[] } });

    render(<MonitoringSection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(axiosClient.get).toHaveBeenCalledWith("/v1/api/users/all");
    });
  });

  it("shows loading state", async () => {
    vi.mocked(alertsApi.useAlerts).mockReturnValue({
      ...mockUseAlertsReturn,
      isLoading: true,
    });

    render(<MonitoringSection />, { wrapper: createWrapper() });

    const alertsTab = screen.getByText("Alerts Logs");
    alertsTab.click();

    await waitFor(() => {
      expect(screen.getByText("Loading alerts...")).toBeInTheDocument();
    });
  });

  it("supports username grouping toggle", async () => {
    const { getByText, getByLabelText } = render(
      <MonitoringSection />,
      { wrapper: createWrapper() }
    );

    // Wait for component to load
    await waitFor(() => {
      expect(getByText("Alerts Logs")).toBeInTheDocument();
    });

    // Click on Alerts Logs tab
    await act(async () => {
      getByText("Alerts Logs").click();
    });

    // Wait for alerts to load (if any)
    await waitFor(() => {
      // Check if grouping toggle exists
      const groupingToggle = getByLabelText(/group by username/i);
      expect(groupingToggle).toBeInTheDocument();
    });

    // Toggle grouping on
    await act(async () => {
      const checkbox = getByLabelText(/group by username/i) as HTMLInputElement;
      checkbox.click();
    });

    // Verify grouping is enabled
    const checkbox = getByLabelText(/group by username/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("shows error state", async () => {
    vi.mocked(alertsApi.useAlerts).mockReturnValue({
      ...mockUseAlertsReturn,
      isError: true,
      error: new Error("Failed to load"),
    });

    render(<MonitoringSection />, { wrapper: createWrapper() });

    const alertsTab = screen.getByText("Alerts Logs");
    alertsTab.click();

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Alerts/i)).toBeInTheDocument();
    });
  });
});

