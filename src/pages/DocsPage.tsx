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
    description: "Retrieves historical price data for a stock symbol over a specified number of days",
    sampleQuery: "?symbol=AMZN&days=180",
    params: {
      symbol: {
        label: "Ticker Symbol",
        value: "AMZN",
      },
      days: {
        label: "Number of Days (1-3650)",
        value: "180",
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
    const url = new URL(baseUrl.replace(/\/$/, "") + endpoint.path);
    Object.keys(endpoint.params).forEach((key) => {
      const input = document.getElementById(`param-${key}`) as HTMLInputElement | null;
      if (input?.value) {
        url.searchParams.set(key, input.value);
      }
    });
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
