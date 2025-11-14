# Stockly Web App

## Project Summary
- Guarded React dashboard for tracking custom stock watchlists.
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
- `src/pages/SettingsPage.tsx` – Controls auto-refresh cadence via `SettingsContext`.
- `src/state/AuthContext.tsx` – Handles session persistence and fallback credential check.
- `src/state/SettingsContext.tsx` – Stores refresh interval in `localStorage`.
- `src/api/client.ts` – REST helpers for `/v1/api/search-stock` and `/v1/api/get-stocks`.
- `src/components/DocsViewer.tsx` – Fetches and renders `public/doc.html` inline (no iframe login loops).
- `functions/api/login.ts` – Cloudflare Pages Function validating `STOCKLY_*` secrets.
- `public/doc.html` – Swagger/HTML docs copied from backend repo.

## How to Run Locally
```bash
cd stockly-webapp
cp .env.example .env    # edit credentials + base URL if needed
npm install
npm run dev
npm run test             # run unit tests (Vitest)
```
Run checks/builds:
```bash
npm run lint
npm run build
npm run preview   # serves dist locally
```

## Environment Variables / Secrets
- `.env` (Vite dev/build):
  - `VITE_API_BASE_URL` (required) – defaults to `https://stockly-api.ahmednasser1993.workers.dev`.
  - `VITE_STOCKLY_USERNAME` / `VITE_STOCKLY_PASS` (required for local fallback auth).
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

## Troubleshooting
- **API Docs tab shows login again** – ensure `public/doc.html` exists; the inlined `DocsViewer` now fetches it directly. Redeploy if you recently copied new docs.
- **401 during login** – set `STOCKLY_USERNAME`/`STOCKLY_PASS` secrets via Wrangler and redeploy so `/api/login` can validate.
- **Quotes not refreshing** – confirm `VITE_API_BASE_URL` points to a reachable backend; test with `curl` as shown above.
- **Env changes ignored in dev** – restart `npm run dev`; Vite only loads env vars on startup.
- **Functions not running** – include the `--functions functions` flag in the deploy command so Cloudflare picks up `/api/login`.
- **Unit tests fail before build** – `npm run build` runs `npm run test` automatically; fix failing Vitest suites before shipping.
