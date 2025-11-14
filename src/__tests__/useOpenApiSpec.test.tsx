import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useOpenApiSpec } from "../hooks/useOpenApiSpec";

vi.mock("../api/adminConfig", () => ({
  fetchOpenApiSpec: vi.fn().mockResolvedValue({ info: { title: "Demo" } }),
}));

function SpecConsumer() {
  const { spec } = useOpenApiSpec();
  return <p>{spec ? String(spec.openapi) : "loading"}</p>;
}

describe("useOpenApiSpec", () => {
  it("ensures openapi version exists", async () => {
    render(<SpecConsumer />);
    await waitFor(() => expect(screen.getByText("3.0.0")).toBeInTheDocument());
  });
});
