import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserCard } from "../components/UserCard";

describe("UserCard", () => {
  const mockUser = {
    username: "testuser",
    email: "test@example.com",
    stocks: ["AAPL", "MSFT"],
    alerts: 3,
    devices: 2,
  };

  it("renders user information correctly", () => {
    const mockOnClick = vi.fn();
    render(<UserCard user={mockUser} onClick={mockOnClick} />);

    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Stocks")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByText("Devices")).toBeInTheDocument();
    // Check counts - "2" appears twice (stocks and devices), "3" appears once (alerts)
    const stockCounts = screen.getAllByText("2");
    expect(stockCounts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3")).toBeInTheDocument(); // Alerts count
  });

  it("calls onClick when card is clicked", () => {
    const mockOnClick = vi.fn();
    const { container } = render(<UserCard user={mockUser} onClick={mockOnClick} />);

    const card = container.querySelector(".user-card");
    expect(card).toBeInTheDocument();
    
    if (card) {
      (card as HTMLElement).click();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it("renders without email when not provided", () => {
    const userWithoutEmail = {
      ...mockUser,
      email: undefined,
    };
    const mockOnClick = vi.fn();
    render(<UserCard user={userWithoutEmail} onClick={mockOnClick} />);

    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.queryByText("test@example.com")).not.toBeInTheDocument();
  });

  it("displays zero counts correctly", () => {
    const userWithZeros = {
      username: "emptyuser",
      stocks: [],
      alerts: 0,
      devices: 0,
    };
    const mockOnClick = vi.fn();
    render(<UserCard user={userWithZeros} onClick={mockOnClick} />);

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(2); // At least alerts and devices
  });
});

