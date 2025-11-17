# Stockly Web App

## Project Summary
- Guarded React dashboard for tracking custom stock watchlists.
- **🔔 Price Alerts** – Set up mobile push notifications when stocks hit target prices.
- **📱 Notification Channel** – All alerts use Expo Push Notifications (mobile-only). Email and Webhook channels are legacy and visible only as disabled options in the UI.
- Built-in Swagger docs tab rendered directly from `public/doc.html`.
- GSAP/ReactBits inspired animations plus Aurora/Sunrise theme toggle.
- Auth + settings stored in `localStorage` with Cloudflare Pages Functions enforcing secrets.
- Hits the production backend at `https://stockly-api.ahmednasser1993.workers.dev`.

## Tech Stack
- React 19 + React Router 7 + TanStack Query 5.
- Vite 7 build system + TypeScript 5.
- Cloudflare Pages for hosting + Functions for login validation.
- GSAP for entrance animations.

## Folder / Component Overview
- `src/main.tsx` – Bootstraps React, router, and providers.
- `src/App.tsx` – Defines `/login`, protected dashboard routes, and catch-all redirect.
- `src/pages/LoginPage.tsx` – Animated hero + secure form that hits `/api/login`.
- `src/pages/HomePage.tsx` – Tabbed dashboard/docs view plus neon hero stats.
- `src/pages/AlertsPage.tsx` – Price alerts dashboard with full CRUD functionality.
- `src/pages/SettingsPage.tsx` – Controls auto-refresh cadence via `SettingsContext`. Includes Developer Tools section for provider failure simulation.
- `src/state/AuthContext.tsx` – Handles session persistence and fallback credential check.
- `src/state/SettingsContext.tsx` – Stores refresh interval in `localStorage`.
- `src/api/client.ts` – REST helpers for `/v1/api/search-stock` and `/v1/api/get-stocks`.
- `src/api/alerts.ts` – REST helpers for alert CRUD operations.
- `src/hooks/useAlerts.ts` – React Query hook for alerts data management.
- `src/components/AlertForm.tsx` – Create/edit alert modal with validation.
- `src/components/DeleteAlertDialog.tsx` – Alert deletion confirmation dialog.
- `src/components/DocsViewer.tsx` – Fetches and renders `public/doc.html` inline (no iframe login loops).
- `functions/api/login.ts` – Cloudflare Pages Function validating `STOCKLY_*` secrets.
- `public/doc.html` – Swagger/HTML docs copied from backend repo.
- `public/openapi-alerts.yaml` – OpenAPI specification for alerts endpoints.

## How to Run Locally

### Prerequisites
Make sure you have the backend API running locally on port 8787:
```bash
# In your backend directory
npm run dev  # or wrangler dev
```

### Start the Frontend
```bash
cd stockly-webapp
npm install
npm run dev              # Automatically connects to http://localhost:8787
npm run test             # run unit tests (Vitest)
```

The app will automatically connect to `http://localhost:8787` in development mode.
Run checks/builds:
```bash
npm run lint
npm run build
npm run preview   # serves dist locally
```

## Environment Variables / Secrets

### Automatic API URL Configuration
The app automatically uses the correct API URL based on the environment:
- **Development** (`npm run dev`): `http://localhost:8787`
- **Production** (`npm run build`): `https://stockly-api.ahmednasser1993.workers.dev`

### Optional Environment Variables
- `.env` (Vite dev/build):
  - `VITE_API_BASE_URL` (optional) – Override the automatic API URL if needed.
  - `VITE_ADMIN_API_BASE_URL` (optional) – Separate admin API URL (defaults to `VITE_API_BASE_URL`).
  - `VITE_STOCKLY_USERNAME` / `VITE_STOCKLY_PASS` (optional) – Local fallback auth credentials.
- Cloudflare Pages secrets (production + preview):
  ```bash
  wrangler pages secret put STOCKLY_USERNAME --project-name stockly-webapp
  wrangler pages secret put STOCKLY_PASS --project-name stockly-webapp
  wrangler pages secret put VITE_API_BASE_URL --project-name stockly-webapp
  ```
  These are consumed by `/api/login` and made available at build time if you mirror them with `VITE_*`.

## How to Deploy
Build + deploy to Pages (production):
```bash
npm run build
wrangler pages deploy dist --project-name stockly-webapp --functions functions --branch production
```
Preview deploys (per-branch):
```bash
npm run build
wrangler pages deploy dist --project-name stockly-webapp --functions functions --branch main
```
Ensure `functions/` is included so `/api/login` runs in production.

## Widget Data Support

The web admin API documentation includes information about widget data consumption. Mobile home screen widgets consume the same `get-stock` and `get-stocks` endpoints as the main app.

**Note**: UI support for "Widget Preview" may be added in a future update to help QA test widget configurations.

### Widget Data Format

Widgets expect stock data that matches the standard `get-stock` response format, with additional fields for staleness detection:

- `stale`: boolean - indicates if data is stale
- `stale_reason`: string - reason for staleness (e.g., "provider_failure", "simulation_mode")
- `lastUpdatedAt`: ISO8601 timestamp - when data was last updated

Mobile apps cache this data locally for widget consumption. See the mobile app README for details on widget implementation.

## Provider Failure Simulation

The Settings page includes a "Developer Tools" tab that allows testing fallback behavior when external providers fail.

### How to Use

1. Navigate to **Settings → Developer Tools**
2. Click **"Trigger Provider Failure (Test Mode)"** to enable simulation
3. When enabled:
   - The API will return stale cached data instead of calling external providers
   - The status indicator shows **🔴 Simulation ACTIVE**
4. Click **"Disable Failure Simulation"** to restore normal provider calls
5. The status indicator shows **🟢 Simulation OFF** when disabled

### Use Cases

- **QA Testing**: Verify that the UI handles stale data correctly
- **Fallback Testing**: Test resilience when providers fail
- **UI Testing**: Validate warning banners and stale data indicators

---

## How to Update / Maintain
```bash
git pull origin main        # grab latest changes
npm install                 # refresh deps
npm run lint && npm run build
wrangler pages deploy dist --project-name stockly-webapp --functions functions
```
- When backend docs change, overwrite `public/doc.html` with the new file.
- Update dependencies carefully; after editing `package.json`, run the build before deploying.

## Database & Migrations
- No local DB is bundled; the UI relies on the Stockly Worker API.
- Fetching data example (acts like a DB select):
  ```ts
  import { fetchStocks } from "./src/api/client";

  const quotes = await fetchStocks(["AAPL", "MSFT"]);
  const apple = quotes.find((quote) => quote.symbol === "AAPL");
  console.log(apple?.price);
  ```
- Backend migrations (if any) live in the backend repo; this project just consumes its endpoints.

## API / Usage Examples
- cURL search example:
  ```bash
  curl "https://stockly-api.ahmednasser1993.workers.dev/v1/api/search-stock?query=AAPL"
  ```
- cURL create alert example:
  ```bash
  curl -X POST https://stockly-api.ahmednasser1993.workers.dev/v1/api/alerts \
    -H "Content-Type: application/json" \
    -d '{
      "symbol": "AAPL",
      "direction": "above",
      "threshold": 200.50,
      "channel": "notification",
      "target": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      "notes": "Watch for breakout"
    }'
  ```
- UI component usage (adding to watchlist):
  ```tsx
  <SearchBar
    query={query}
    onQueryChange={setQuery}
    onSubmit={handleAddSymbol}
    suggestions={searchQuery.data ?? []}
    onSelectSuggestion={handleSelectSuggestion}
    loading={searchQuery.isFetching}
  />
  ```
- Alerts hook usage:
  ```tsx
  const { alerts, createAlert, updateAlert, deleteAlert } = useAlerts();
  
  // Create an alert
  await createAlert({
    symbol: "AAPL",
    direction: "above",
    threshold: 200.50,
    channel: "notification",
    target: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  });
  ```
  
  **Note:** Email and Webhook channels are legacy and no longer supported. Web App alerts always use mobile push notifications (`channel: "notification"`). Create alerts from the Stockly mobile app to automatically use your device's push token.

## Troubleshooting
- **Cannot connect to API in development** – ensure your backend is running on `http://localhost:8787`. The app automatically uses this URL in dev mode.
- **API connection errors in production** – the build automatically uses `https://stockly-api.ahmednasser1993.workers.dev`. No configuration needed.
- **Want to override API URL** – set `VITE_API_BASE_URL` in your `.env` file to use a custom API endpoint.
- **API Docs tab shows login again** – ensure `public/doc.html` exists; the inlined `DocsViewer` now fetches it directly. Redeploy if you recently copied new docs.
- **401 during login** – set `STOCKLY_USERNAME`/`STOCKLY_PASS` secrets via Wrangler and redeploy so `/api/login` can validate.
- **Quotes not refreshing** – confirm your backend API is reachable; test with `curl` as shown above.
- **Env changes ignored in dev** – restart `npm run dev`; Vite only loads env vars on startup.
- **Functions not running** – include the `--functions functions` flag in the deploy command so Cloudflare picks up `/api/login`.
- **Unit tests fail before build** – `npm run build` runs `npm run test` automatically; fix failing Vitest suites before shipping.
