import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchStocks, searchSymbols } from "../api/client";

const mockFetch = (payload: unknown, ok = true) => {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(payload),
  });
};

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("skips search when query is too short", async () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    const result = await searchSymbols("A");
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("requests search results when query is long enough", async () => {
    const mockResponse = [{ symbol: "AAPL", name: "Apple" }];
    const mockFetchFn = mockFetch(mockResponse);
    global.fetch = mockFetchFn as unknown as typeof fetch;

    const result = await searchSymbols("AA");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (mockFetchFn.mock.calls[0] as [string])[0];
    expect(calledUrl).toContain("/v1/api/search-stock");
    expect(result).toEqual(mockResponse);
  });

  it("skips fetchStocks when no symbols provided", async () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    const result = await fetchStocks([]);
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches stocks when symbols exist", async () => {
    const payload = [{ symbol: "AAPL", price: 190 }];
    const mockFetchFn = mockFetch(payload);
    global.fetch = mockFetchFn as unknown as typeof fetch;

    const result = await fetchStocks(["AAPL"]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (mockFetchFn.mock.calls[0] as [string])[0];
    expect(calledUrl).toContain("symbols=AAPL");
    expect(result).toEqual(payload);
  });
});
