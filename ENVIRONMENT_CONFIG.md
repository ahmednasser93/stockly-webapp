# Environment Configuration Guide

## Automatic API URL Configuration ✨

The Stockly webapp now automatically uses the correct API URL based on your environment:

### Development Mode (`npm run dev`)
```
API Base URL: http://localhost:8787
```
- Automatically connects to your local backend
- No configuration needed
- Perfect for local development

### Production Mode (`npm run build`)
```
API Base URL: https://stockly-api.ahmednasser1993.workers.dev
```
- Automatically uses production API
- Works for APK builds, iOS bundles, and web deploys
- No configuration needed

---

## How It Works

The app uses Vite's `import.meta.env.DEV` flag to detect the environment:

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV
    ? "http://localhost:8787"
    : "https://stockly-api.ahmednasser1993.workers.dev");
```

This is implemented in:
- `src/api/client.ts` (stock quotes & search)
- `src/api/alerts.ts` (price alerts)
- `src/api/adminConfig.ts` (admin features)

---

## Override with Custom URL (Optional)

If you need to use a different API URL, create a `.env` file:

```bash
# .env
VITE_API_BASE_URL=https://your-custom-api.example.com
```

This will override the automatic configuration in **both** development and production.

---

## Configuration Priority

The API URL is determined in this order:

1. **`VITE_API_BASE_URL`** (environment variable) - Highest priority
2. **`import.meta.env.DEV`** (automatic detection)
   - `true` → `http://localhost:8787`
   - `false` → `https://stockly-api.ahmednasser1993.workers.dev`

---

## Examples

### Local Development (default)
```bash
npm run dev
# Uses: http://localhost:8787
```

### Local Development (custom backend)
```bash
# .env
VITE_API_BASE_URL=http://localhost:9000

npm run dev
# Uses: http://localhost:9000
```

### Production Build (default)
```bash
npm run build
# Uses: https://stockly-api.ahmednasser1993.workers.dev
```

### Production Build (custom API)
```bash
# .env
VITE_API_BASE_URL=https://staging-api.example.com

npm run build
# Uses: https://staging-api.example.com
```

### Mobile Builds
```bash
# APK for Android
npm run build
# Uses: https://stockly-api.ahmednasser1993.workers.dev

# iOS Bundle
npm run build
# Uses: https://stockly-api.ahmednasser1993.workers.dev
```

---

## Admin API Configuration

The admin API uses a similar pattern with an additional environment variable:

```bash
# .env (optional)
VITE_ADMIN_API_BASE_URL=https://admin-api.example.com
```

Priority order:
1. `VITE_ADMIN_API_BASE_URL`
2. `VITE_API_BASE_URL`
3. Automatic detection (same as main API)

---

## Testing

The configuration works correctly in all scenarios:

### Unit Tests
```bash
npm run test
# Tests use mocked fetch, not affected by URL config
```

### Dev Server
```bash
npm run dev
# Verify in browser console:
# Network tab should show requests to http://localhost:8787
```

### Production Build
```bash
npm run build
npm run preview
# Verify in browser console:
# Network tab should show requests to https://stockly-api.ahmednasser1993.workers.dev
```

---

## Cloudflare Pages Deployment

When deploying to Cloudflare Pages, the production URL is automatically used:

```bash
# Build and deploy
npm run build
wrangler pages deploy dist \
  --project-name stockly-webapp \
  --functions functions \
  --branch production

# Result: Uses https://stockly-api.ahmednasser1993.workers.dev
```

To use a custom API in production, set it as a Cloudflare environment variable:

```bash
wrangler pages secret put VITE_API_BASE_URL --project-name stockly-webapp
# Enter your custom URL when prompted
```

---

## Troubleshooting

### Problem: "Cannot connect to API" in development
**Solution**: Make sure your backend is running on port 8787:
```bash
# In your backend directory
npm run dev
# or
wrangler dev --port 8787
```

### Problem: Development connects to production API
**Solution**: Check if you have `VITE_API_BASE_URL` set in `.env`. Remove it or set it to `http://localhost:8787`.

### Problem: Production build connects to localhost
**Solution**: This shouldn't happen with automatic configuration. If it does:
1. Check your build process
2. Verify `import.meta.env.DEV` is `false` in production
3. Remove any `VITE_API_BASE_URL` that points to localhost

### Problem: Want to test production API locally
**Solution**: Create a `.env` file:
```bash
VITE_API_BASE_URL=https://stockly-api.ahmednasser1993.workers.dev
```
Then run `npm run dev`.

---

## Summary

✅ **No configuration needed** for standard development and production  
✅ **Development**: Automatically uses `http://localhost:8787`  
✅ **Production**: Automatically uses `https://stockly-api.ahmednasser1993.workers.dev`  
✅ **Override**: Use `VITE_API_BASE_URL` environment variable if needed  
✅ **Mobile builds**: Production URL used automatically  
✅ **Backward compatible**: Existing deployments continue working  

---

**Last Updated**: November 14, 2025  
**Vite Version**: 7.2.2  
**Mode Detection**: `import.meta.env.DEV`

