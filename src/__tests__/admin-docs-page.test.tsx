import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminDocsPage } from "../pages/AdminDocsPage";
import { useOpenApiSpec } from "../hooks/useOpenApiSpec";

vi.mock("swagger-ui-react", () => ({
  __esModule: true,
  default: () => <div>swagger-ui</div>,
}));

vi.mock("../hooks/useOpenApiSpec");
const mockedHook = vi.mocked(useOpenApiSpec);

describe("AdminDocsPage", () => {
  beforeEach(() => {
    mockedHook.mockReturnValue({
      spec: { openapi: "3.0.0", info: { title: "Demo" } },
      error: null,
    });
  });

  it("renders swagger panel", () => {
    render(<AdminDocsPage />);
    expect(screen.getByText(/Stockly Admin API/)).toBeInTheDocument();
    expect(screen.getByText("swagger-ui")).toBeInTheDocument();
  });
});
