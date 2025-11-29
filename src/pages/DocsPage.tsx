import { useEffect, useRef, useState } from "react";
import { AuroraBackground } from "../components/reactbits/AuroraBackground";

const endpoints = [
  {
    name: "Health Check",
    method: "GET",
    path: "/v1/api/health",
    description: "Returns a simple heartbeat response",
    sampleQuery: "",
    params: {},
  },
  {
    name: "Get Stock Quote",
    method: "GET",
    path: "/v1/api/get-stock",
    description: "Fetches the latest quote for a specific symbol",
    sampleQuery: "?symbol=AAPL",
    params: {
      symbol: {
        label: "Ticker Symbol",
        value: "AAPL",
      },
    },
  },
  {
    name: "Search Stock",
    method: "GET",
    path: "/v1/api/search-stock",
    description: "Searches for matching ticker symbols",
    sampleQuery: "?query=AP",
    params: {
      query: {
        label: "Partial Symbol or Name",
        value: "AP",
      },
    },
  },
  {
    name: "Get Multiple Stocks",
    method: "GET",
    path: "/v1/api/get-stocks",
    description: "Fetches multiple symbols in one request",
    sampleQuery: "?symbols=AMZN,AAPL,TSLA",
    params: {
      symbols: {
        label: "Comma separated symbols",
        value: "AMZN,AAPL,TSLA",
      },
    },
  },
  {
    name: "Get Historical Prices",
    method: "GET",
    path: "/v1/api/get-historical",
    description: "Retrieves historical price data for a stock symbol. Supports date range filtering via 'from' and 'to' parameters, or backward-compatible 'days' parameter. Data is fetched from D1 database (populated by get-stock endpoint). Automatically fetches from FMP API if database is empty.",
    sampleQuery: "?symbol=AMZN&from=2025-01-01&to=2025-01-31",
    params: {
      symbol: {
        label: "Ticker Symbol",
        value: "AMZN",
      },
      from: {
        label: "From Date (YYYY-MM-DD)",
        value: "2025-01-01",
      },
      to: {
        label: "To Date (YYYY-MM-DD)",
        value: "2025-01-31",
      },
    },
  },
  {
    name: "Get Historical Prices (Backward Compatible)",
    method: "GET",
    path: "/v1/api/get-historical",
    description: "Retrieves historical price data using the 'days' parameter (backward compatible format).",
    sampleQuery: "?symbol=AMZN&days=180",
    params: {
      symbol: {
        label: "Ticker Symbol",
        value: "AMZN",
      },
      days: {
        label: "Number of Days",
        value: "180",
      },
    },
  },
  {
    name: "Get Admin Config",
    method: "GET",
    path: "/config/get",
    description: "Retrieves the current admin configuration including polling interval, feature flags, and alert throttling settings",
    sampleQuery: "",
    params: {},
  },
  {
    name: "Get User Settings",
    method: "GET",
    path: "/v1/api/settings/:userId",
    description: "Retrieves user-specific settings including refresh interval preference",
    sampleQuery: "",
    params: {
      userId: {
        label: "User ID",
        value: "user123",
      },
    },
  },
  {
    name: "Get User Preferences",
    method: "GET",
    path: "/v1/api/preferences/:userId",
    description: "Retrieves user-specific notification preferences",
    sampleQuery: "",
    params: {
      userId: {
        label: "User ID",
        value: "user123",
      },
    },
  },
  {
    name: "Get Stock News (Single)",
    method: "GET",
    path: "/v1/api/get-news",
    description: "Fetches latest stock news articles for a single stock symbol",
    sampleQuery: "?symbol=AAPL",
    params: {
      symbol: {
        label: "Ticker Symbol",
        value: "AAPL",
      },
    },
  },
  {
    name: "Get Stock News (Multiple)",
    method: "GET",
    path: "/v1/api/get-news",
    description: "Fetches latest stock news articles for multiple stock symbols (max 10)",
    sampleQuery: "?symbols=AAPL,MSFT,GOOGL",
    params: {
      symbols: {
        label: "Comma separated symbols (max 10)",
        value: "AAPL,MSFT,GOOGL",
      },
    },
  },
  {
    name: "Get Stock News (With Pagination)",
    method: "GET",
    path: "/v1/api/get-news",
    description: "Fetches stock news with pagination, date filtering, and result limiting",
    sampleQuery: "?symbol=AAPL&from=2025-01-01&to=2025-01-31&page=0&limit=20",
    params: {
      symbol: {
        label: "Ticker Symbol",
        value: "AAPL",
      },
      from: {
        label: "From Date (YYYY-MM-DD)",
        value: "2025-01-01",
      },
      to: {
        label: "To Date (YYYY-MM-DD)",
        value: "2025-01-31",
      },
      page: {
        label: "Page Number (0-based)",
        value: "0",
      },
      limit: {
        label: "Results Per Page (1-250)",
        value: "20",
      },
    },
  },
];

const BASE_URLS = [
  {
    label: "Production Worker",
    value: "https://stockly-api.ahmednasser1993.workers.dev",
  },
  { label: "Preview Worker", value: "https://stockly-api.pages.dev" },
  { label: "Local Dev", value: "http://localhost:8787" },
];

export function DocsPage() {
  const [baseUrl, setBaseUrl] = useState(BASE_URLS[0].value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [output, setOutput] = useState("Select an endpoint to begin…");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [activeIndex]);

  const endpoint = endpoints[activeIndex];

  const handleSubmit = async () => {
    let path = endpoint.path;

    // Handle path parameters (e.g., :userId)
    if (path.includes(":userId")) {
      const userIdInput = document.getElementById("param-userId") as HTMLInputElement | null;
      const userId = userIdInput?.value || "user123";
      path = path.replace(":userId", userId);
    }

    const url = new URL(baseUrl.replace(/\/$/, "") + path);

    // Add query parameters
    Object.keys(endpoint.params).forEach((key) => {
      if (key !== "userId") { // userId is already in path
        const input = document.getElementById(`param-${key}`) as HTMLInputElement | null;
        if (input?.value) {
          url.searchParams.set(key, input.value);
        }
      }
    });

    // Special handling for get-news endpoint - only use one param (symbol OR symbols)
    if (path === "/v1/api/get-news") {
      const symbolInput = document.getElementById("param-symbol") as HTMLInputElement | null;
      const symbolsInput = document.getElementById("param-symbols") as HTMLInputElement | null;
      const fromInput = document.getElementById("param-from") as HTMLInputElement | null;
      const toInput = document.getElementById("param-to") as HTMLInputElement | null;
      const pageInput = document.getElementById("param-page") as HTMLInputElement | null;
      const limitInput = document.getElementById("param-limit") as HTMLInputElement | null;

      // Clear both symbol params first
      url.searchParams.delete("symbol");
      url.searchParams.delete("symbols");

      // Use symbol if provided, otherwise use symbols
      if (symbolInput?.value) {
        url.searchParams.set("symbol", symbolInput.value);
      } else if (symbolsInput?.value) {
        url.searchParams.set("symbols", symbolsInput.value);
      }

      // Add pagination parameters if provided
      if (fromInput?.value) {
        url.searchParams.set("from", fromInput.value);
      }
      if (toInput?.value) {
        url.searchParams.set("to", toInput.value);
      }
      if (pageInput?.value) {
        url.searchParams.set("page", pageInput.value);
      }
      if (limitInput?.value) {
        url.searchParams.set("limit", limitInput.value);
      }
    }

    setLoading(true);
    setOutput("Sending request…");
    try {
      const response = await fetch(url.toString(), { method: endpoint.method });
      const text = await response.text();
      try {
        setOutput(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setOutput(text || `[${response.status}] Empty response`);
      }
    } catch (error) {
      setOutput(`Request failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page docs-page">
      <AuroraBackground variant="dashboard">
        <div className="hero-panel">
          <div>
            <p className="eyebrow">API reference</p>
            <h1>Stockly Swagger, embedded.</h1>
            <p className="muted">
              Run sample requests and view schemas without leaving the guard-railed experience.
            </p>
          </div>
        </div>
      </AuroraBackground>

      <div className="card docs-grid">
        <div className="endpoint-list">
          <h2>Endpoints</h2>
          <ul>
            {endpoints.map((item, index) => (
              <li key={item.name}>
                <button
                  type="button"
                  className={index === activeIndex ? "active" : ""}
                  onClick={() => setActiveIndex(index)}
                >
                  <span>{item.name}</span>
                  <code>{item.path}</code>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="endpoint-details" ref={formRef}>
          <div className="endpoint-header">
            <span className="method-chip">{endpoint.method}</span>
            <code>{endpoint.path}</code>
            <p>{endpoint.description}</p>
          </div>
          <label>
            Base URL
            <select value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}>
              {BASE_URLS.map((url) => (
                <option key={url.value} value={url.value}>
                  {url.label}
                </option>
              ))}
            </select>
          </label>
          <div className="param-grid">
            {Object.entries(endpoint.params).map(([key, config]) => (
              <label key={key} htmlFor={`param-${key}`}>
                {config.label}
                <input
                  id={`param-${key}`}
                  name={key}
                  defaultValue={config.value}
                  placeholder={config.label}
                />
              </label>
            ))}
            {!Object.keys(endpoint.params).length && (
              <p className="muted">This endpoint does not take query parameters.</p>
            )}
          </div>
          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Sending…" : "Send request"}
          </button>
          <pre>{output}</pre>
        </div>
      </div>
    </section>
  );
}
