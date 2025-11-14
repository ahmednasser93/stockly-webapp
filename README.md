# Stockly Web App

A lightweight stock dashboard for the Stockly platform. It mirrors the mobile experience with a login screen, searchable ticker list, detailed quote cards, settings for refresh cadence, and manual refresh support. Built with Vite, React, TypeScript, React Query, and React Router so it can be deployed as a Cloudflare Pages application that calls the existing Stockly backend.

## Features

- Auth gate that reuses the `STOCKLY_USERNAME` / `STOCKLY_PASS` credentials already present on the backend
- Autocomplete search backed by `/v1/api/search-stock` with instant add-to-watchlist behavior
- Quote board that polls `/v1/api/get-stocks` for all tracked tickers and shows price/high/low/volume widgets
- Manual refresh button plus adjustable auto-refresh interval stored in local storage
- Responsive layout with cards and chips to match the existing product look-and-feel

## Getting Started

```bash
cd stockly-webapp
cp .env.example .env # update values for your environment
npm install
npm run dev
```

Environment variables (all prefixed with `VITE_` so they are exposed at build time):

- `VITE_API_BASE_URL` – Fully-qualified base URL for the Stockly backend (e.g. the deployed Cloudflare Worker origin)
- `VITE_STOCKLY_USERNAME` – Username that should unlock the dashboard
- `VITE_STOCKLY_PASS` – Password paired with the username above

## Testing the Flows

1. Launch `npm run dev` and open the printed URL
2. Sign in with the credentials listed in `.env`
3. Use the search field to add a symbol or choose one from the autocomplete suggestions
4. Watchlist entries appear as cards; use the “Refresh now” button any time or rely on the timer shown in the footer
5. Adjust the auto-refresh cadence on the Settings page

## Deploying on Cloudflare Pages

1. Create a new Pages project that points to the `stockly-webapp` folder (repo does **not** need to be coupled to the backend)
2. Configure the build command (`npm run build`) and output directory (`dist`)
3. Add the 3 environment variables above to the Pages project (production + preview) so the login gate and API base URL match production
4. Deploy; the `npm run preview` script can be used locally to test the production build if desired

> When hosting on Cloudflare, keep the backend as a separate project (Stockly Worker) and simply reference its public URL via `VITE_API_BASE_URL` to keep deployments decoupled.

## Tech Stack

- [Vite](https://vitejs.dev/) for bundling
- [React Router](https://reactrouter.com/) for navigation
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and cache management
- CSS modules written with custom properties for a clean neon look

Feel free to tailor the branding or component styling to match any updated design assets you may have.
