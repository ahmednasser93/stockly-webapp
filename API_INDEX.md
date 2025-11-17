# Stockly Webapp - API Index

> **Complete reference for all API endpoints and how to use them**

---

## 📋 Table of Contents

1. [API Configuration](#api-configuration)
2. [Stock API](#stock-api)
3. [Alerts API](#alerts-api)
4. [Admin API](#admin-api)
5. [Authentication API](#authentication-api)
6. [Error Handling](#error-handling)
7. [TypeScript Types](#typescript-types)

---

## API Configuration

### Base URLs

**Automatic Configuration:**
- **Development**: `http://localhost:8787`
- **Production**: `https://stockly-api.ahmednasser1993.workers.dev`

**Override (optional):**
```bash
# .env
VITE_API_BASE_URL=https://custom-api.example.com
```

### Files
- `src/api/client.ts` - Stock API
- `src/api/alerts.ts` - Alerts API
- `src/api/adminConfig.ts` - Admin API

---

## Stock API

### Base Path: `/v1/api`

---

### 1. Search Stocks

**Endpoint:** `GET /v1/api/search-stock`

**Description:** Search for stock symbols with autocomplete

**Query Parameters:**
- `query` (string, required) - Search term (min 2 characters)

**Response:**
```typescript
SearchResult[] // Array of search results
```

**Example:**
```typescript
import { searchSymbols } from "./api/client";

const results = await searchSymbols("AAPL");
// Returns: [{ symbol: "AAPL", name: "Apple Inc.", ... }]
```

**cURL:**
```bash
curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/search-stock?query=AAPL"
```

**Response Example:**
```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "currency": "USD",
    "stockExchange": "NASDAQ"
  }
]
```

**Error Responses:**
- `400` - Invalid query parameter
- `500` - Server error

---

### 2. Get Multiple Stocks

**Endpoint:** `GET /v1/api/get-stocks`

**Description:** Get real-time quotes for multiple stocks

**Query Parameters:**
- `symbols` (string, required) - Comma-separated stock symbols

**Response:**
```typescript
StockQuote[] // Array of stock quotes
```

**Example:**
```typescript
import { fetchStocks } from "./api/client";

const quotes = await fetchStocks(["AAPL", "MSFT", "GOOGL"]);
```

**cURL:**
```bash
curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/get-stocks?symbols=AAPL,MSFT"
```

**Response Example:**
```json
[
  {
    "symbol": "AAPL",
    "price": 195.50,
    "dayLow": 193.00,
    "dayHigh": 197.00,
    "volume": 50000000,
    "timestamp": 1699977600000
  },
  {
    "symbol": "MSFT",
    "price": 360.00,
    "dayLow": 358.00,
    "dayHigh": 365.00,
    "volume": 30000000,
    "timestamp": 1699977600000
  }
]
```

**Error Responses:**
- `400` - Invalid symbols parameter
- `500` - Server error

---

### 3. Get Single Stock

**Endpoint:** `GET /v1/api/get-stock`

**Description:** Get real-time quote for a single stock

**Query Parameters:**
- `symbol` (string, required) - Stock symbol

**Response:**
```typescript
StockQuote // Single stock quote
```

**cURL:**
```bash
curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/get-stock?symbol=AAPL"
```

---

## Alerts API

### Base Path: `/v1/api/alerts`

---

### 1. List All Alerts

**Endpoint:** `GET /v1/api/alerts`

**Description:** Get all configured price alerts

**Response:**
```typescript
ListAlertsResponse // { alerts: Alert[] }
```

**Example:**
```typescript
import { listAlerts } from "./api/alerts";

const alerts = await listAlerts();
```

**cURL:**
```bash
curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts"
```

**Response Example:**
```json
{
  "alerts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "symbol": "AAPL",
      "direction": "above",
      "threshold": 200.50,
      "status": "active",
      "channel": "email",
      "target": "user@example.com",
      "notes": "Watch for breakout",
      "createdAt": "2025-11-14T10:30:00.000Z",
      "updatedAt": "2025-11-14T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500` - Server error

---

### 2. Create Alert

**Endpoint:** `POST /v1/api/alerts`

**Description:** Create a new price alert

**Request Body:**
```typescript
CreateAlertRequest
```

**Example:**
```typescript
import { createAlert } from "./api/alerts";

const newAlert = await createAlert({
  symbol: "AAPL",
  direction: "above",
  threshold: 200.50,
  channel: "email",
  target: "user@example.com",
  notes: "Optional note"
});
```

**cURL:**
```bash
curl -X POST https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "direction": "above",
    "threshold": 200.50,
    "channel": "email",
    "target": "user@example.com",
    "notes": "Watch for breakout"
  }'
```

**Request Body Schema:**
```json
{
  "symbol": "string (required)",
  "direction": "above | below (required)",
  "threshold": "number (required, positive)",
  "channel": "email | webhook (required)",
  "target": "string (required, email or URL)",
  "notes": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "AAPL",
  "direction": "above",
  "threshold": 200.50,
  "status": "active",
  "channel": "email",
  "target": "user@example.com",
  "notes": "Watch for breakout",
  "createdAt": "2025-11-14T10:30:00.000Z",
  "updatedAt": "2025-11-14T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Validation error (invalid direction, negative threshold, etc.)
- `500` - Server error

**Validation Rules:**
- `symbol`: Required, non-empty string (auto-uppercased)
- `direction`: Must be "above" or "below"
- `threshold`: Required, positive number
- `channel`: Must be "email" or "webhook"
- `target`: Required, valid email (for email) or URL (for webhook)
- `notes`: Optional string

---

### 3. Get Single Alert

**Endpoint:** `GET /v1/api/alerts/{id}`

**Description:** Get a specific alert by ID

**Path Parameters:**
- `id` (string, required) - Alert UUID

**Response:**
```typescript
Alert
```

**Example:**
```typescript
import { getAlert } from "./api/alerts";

const alert = await getAlert("550e8400-e29b-41d4-a716-446655440000");
```

**cURL:**
```bash
curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts/550e8400-e29b-41d4-a716-446655440000"
```

**Error Responses:**
- `404` - Alert not found
- `500` - Server error

---

### 4. Update Alert

**Endpoint:** `PUT /v1/api/alerts/{id}`

**Description:** Update an existing alert (partial updates supported)

**Path Parameters:**
- `id` (string, required) - Alert UUID

**Request Body:**
```typescript
UpdateAlertRequest // All fields optional
```

**Example:**
```typescript
import { updateAlert } from "./api/alerts";

// Update threshold only
await updateAlert("550e8400-...", { threshold: 210.00 });

// Update status only
await updateAlert("550e8400-...", { status: "paused" });

// Update multiple fields
await updateAlert("550e8400-...", {
  threshold: 210.00,
  status: "paused",
  notes: "Updated note"
});
```

**cURL:**
```bash
curl -X PUT https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts/550e8400-... \
  -H "Content-Type: application/json" \
  -d '{
    "threshold": 210.00,
    "status": "paused"
  }'
```

**Request Body Schema:**
```json
{
  "symbol": "string (optional)",
  "direction": "above | below (optional)",
  "threshold": "number (optional, positive)",
  "status": "active | paused (optional)",
  "channel": "email | webhook (optional)",
  "target": "string (optional)",
  "notes": "string | null (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "AAPL",
  "direction": "above",
  "threshold": 210.00,
  "status": "paused",
  "channel": "email",
  "target": "user@example.com",
  "notes": "Updated note",
  "createdAt": "2025-11-14T10:30:00.000Z",
  "updatedAt": "2025-11-14T15:45:00.000Z"
}
```

**Error Responses:**
- `400` - Validation error or no fields provided
- `404` - Alert not found
- `500` - Server error

---

### 5. Delete Alert

**Endpoint:** `DELETE /v1/api/alerts/{id}`

**Description:** Delete an alert

**Path Parameters:**
- `id` (string, required) - Alert UUID

**Response:**
```typescript
{ success: boolean }
```

**Example:**
```typescript
import { deleteAlert } from "./api/alerts";

await deleteAlert("550e8400-e29b-41d4-a716-446655440000");
```

**cURL:**
```bash
curl -X DELETE https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts/550e8400-...
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Responses:**
- `404` - Alert not found
- `500` - Server error

---

## Admin API

### Base Path: `/config` and `/monitor`

---

### 1. Get Admin Config

**Endpoint:** `GET /config/get`

**Description:** Get backend configuration

**Response:**
```typescript
AdminConfig
```

**Example:**
```typescript
import { getAdminConfig } from "./api/adminConfig";

const config = await getAdminConfig();
```

**Response Example:**
```json
{
  "pollingIntervalSec": 30,
  "primaryProvider": "alpha-feed",
  "backupProvider": "beta-feed",
  "alertThrottle": {
    "maxAlerts": 100,
    "windowSeconds": 60
  },
  "featureFlags": {
    "alerting": true,
    "sandboxMode": false
  }
}
```

---

### 2. Update Admin Config

**Endpoint:** `POST /config/update`

**Description:** Update backend configuration

**Request Body:**
```typescript
AdminConfigUpdate // Partial<AdminConfig>
```

**Example:**
```typescript
import { updateAdminConfig } from "./api/adminConfig";

await updateAdminConfig({
  pollingIntervalSec: 60,
  featureFlags: { alerting: true }
});
```

---

### 3. Get Monitoring Metrics

**Endpoint:** `GET /monitor/metrics`

**Description:** Get real-time monitoring data

**Response:**
```typescript
MonitoringSnapshot
```

**Example:**
```typescript
import { getMonitoringSnapshot } from "./api/adminConfig";

const metrics = await getMonitoringSnapshot();
```

**Response Example:**
```json
{
  "latencyMs": [110, 120, 140, 130],
  "throughputPerMin": [200, 230, 240, 220],
  "errorRate": [1, 2, 1, 3],
  "dbLagMs": 80
}
```

---

### 4. Get OpenAPI Spec

**Endpoint:** `GET /openapi.json`

**Description:** Get OpenAPI specification

**Response:**
```typescript
Record<string, unknown> // OpenAPI 3.0 spec
```

**Example:**
```typescript
import { fetchOpenApiSpec } from "./api/adminConfig";

const spec = await fetchOpenApiSpec();
```

---

## Authentication API

### Endpoint: `POST /api/login`

**Description:** Authenticate user (Cloudflare Function)

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "error": "Invalid credentials"
}
```

**Example:**
```typescript
const response = await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});

if (response.ok) {
  // Login successful
}
```

---

## Error Handling

### Standard Error Response

All API errors return:
```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Successful GET/PUT/DELETE |
| `201` | Created | Successful POST |
| `400` | Bad Request | Validation error, invalid parameters |
| `401` | Unauthorized | Authentication failed |
| `404` | Not Found | Resource doesn't exist |
| `500` | Server Error | Internal server error |

### Error Handling Pattern

```typescript
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || `Request failed with ${res.status}`;
    } catch {
      errorMessage = await res.text();
    }
    throw new Error(errorMessage || `Request failed with ${res.status}`);
  }
  return await res.json();
}
```

### Try-Catch Usage

```typescript
try {
  const data = await fetchStocks(["AAPL"]);
  // Handle success
} catch (error) {
  console.error("API Error:", error.message);
  // Handle error
}
```

---

## TypeScript Types

### Stock Types

```typescript
export type SearchResult = {
  symbol: string;
  name: string;
  currency?: string;
  stockExchange?: string;
};

export type StockQuote = {
  symbol: string;
  price: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  volume: number | null;
  timestamp: number | null;
};
```

### Alert Types

```typescript
export type AlertDirection = "above" | "below";
export type AlertStatus = "active" | "paused";
export type AlertChannel = "email" | "webhook";

export interface Alert {
  id: string;
  symbol: string;
  direction: AlertDirection;
  threshold: number;
  status: AlertStatus;
  channel: AlertChannel;
  target: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRequest {
  symbol: string;
  direction: AlertDirection;
  threshold: number;
  channel: AlertChannel;
  target: string;
  notes?: string;
}

export interface UpdateAlertRequest {
  symbol?: string;
  direction?: AlertDirection;
  threshold?: number;
  status?: AlertStatus;
  channel?: AlertChannel;
  target?: string;
  notes?: string | null;
}

export interface ListAlertsResponse {
  alerts: Alert[];
}

export interface ErrorResponse {
  error: string;
}
```

### Admin Types

```typescript
export type AdminConfig = {
  pollingIntervalSec: number;
  primaryProvider: string;
  backupProvider: string;
  alertThrottle: {
    maxAlerts: number;
    windowSeconds: number;
  };
  featureFlags: {
    alerting: boolean;
    sandboxMode: boolean;
  };
};

export type AdminConfigUpdate = Partial<AdminConfig>;

export type MonitoringSnapshot = {
  latencyMs: number[];
  throughputPerMin: number[];
  errorRate: number[];
  dbLagMs: number;
};
```

---

## React Query Integration

### Query Pattern

```typescript
import { useQuery } from "@tanstack/react-query";
import { listAlerts } from "./api/alerts";

const alertsQuery = useQuery({
  queryKey: ["alerts"],
  queryFn: listAlerts,
  staleTime: 30 * 1000, // 30 seconds
  refetchInterval: 60 * 1000, // 1 minute
});

// Usage
const { data, isLoading, error, refetch } = alertsQuery;
```

### Mutation Pattern

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAlert } from "./api/alerts";

const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: createAlert,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  },
  onError: (error) => {
    console.error("Failed to create alert:", error);
  },
});

// Usage
await createMutation.mutateAsync(alertData);
```

---

## CORS Configuration

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Rate Limiting

Currently no rate limiting enforced. Consider implementing if needed:
- Per-IP limits
- Per-user limits
- Throttling on mutations

---

## Caching Strategy

### React Query Cache Times

| Resource | Stale Time | Refetch Interval |
|----------|------------|------------------|
| Alerts | 30s | Manual |
| Stock Prices | 0s | 60s (when viewing alerts) |
| Stock Search | 5m | Manual |
| Admin Config | 1m | Manual |
| Monitoring | 10s | 30s |

### Cache Invalidation

```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ["alerts"] });

// Invalidate all queries
queryClient.invalidateQueries();

// Remove specific query
queryClient.removeQueries({ queryKey: ["alerts", id] });
```

---

## Testing APIs

### Using cURL

```bash
# Test search
curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/search-stock?query=AAPL"

# Test create alert
curl -X POST https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","direction":"above","threshold":200.50,"channel":"email","target":"test@example.com"}'

# Test update alert
curl -X PUT https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"paused"}'

# Test delete alert
curl -X DELETE https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts/{id}
```

### Using Postman/Insomnia

Import the OpenAPI spec: `public/openapi-alerts.yaml`

---

## Quick Reference

### Import Statements

```typescript
// Stock API
import { searchSymbols, fetchStocks } from "./api/client";

// Alerts API
import { listAlerts, createAlert, updateAlert, deleteAlert } from "./api/alerts";

// Admin API
import { getAdminConfig, updateAdminConfig, getMonitoringSnapshot } from "./api/adminConfig";

// Types
import type { Alert, CreateAlertRequest, StockQuote } from "./types";
```

### Common Operations

```typescript
// Search stocks
const results = await searchSymbols("AAPL");

// Get stock quotes
const quotes = await fetchStocks(["AAPL", "MSFT"]);

// List alerts
const alerts = await listAlerts();

// Create alert
const alert = await createAlert({
  symbol: "AAPL",
  direction: "above",
  threshold: 200.50,
  channel: "email",
  target: "user@example.com"
});

// Update alert
await updateAlert(alertId, { status: "paused" });

// Delete alert
await deleteAlert(alertId);
```

---

**For complete API documentation, see `public/openapi-alerts.yaml`**




