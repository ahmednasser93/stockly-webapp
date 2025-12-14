# Google OAuth Configuration

## Overview

The Google OAuth Client ID is automatically configured with multiple fallback mechanisms to ensure it always works, even if environment variables are not set.

## Configuration Priority

The Google OAuth Client ID is determined in this order:

1. **`VITE_GOOGLE_CLIENT_ID` environment variable** (highest priority)
   - Set during build time
   - Can be set in:
     - Shell environment: `export VITE_GOOGLE_CLIENT_ID=...`
     - `.env.production` file (if not gitignored)
     - Cloudflare Pages build environment variables
     - Deployment script (`scripts/deploy-prod.sh`)

2. **Hardcoded production default** (fallback)
   - Located in: `src/config/google-oauth.ts`
   - Value: `272719199106-9hpeemg60nqoph9t52audf6hmri27mb6.apps.googleusercontent.com`
   - This ensures the app always works, even if env vars are missing

## Files

- **`src/config/google-oauth.ts`** - Configuration module with fallback
- **`src/main.tsx`** - Imports and uses the config
- **`scripts/deploy-prod.sh`** - Sets env var during deployment

## Why This Approach?

1. **Reliability**: Hardcoded fallback ensures the app always has a client ID
2. **Flexibility**: Environment variables can override for different environments
3. **Security**: Client IDs are public (not secrets), so hardcoding is safe
4. **Automation**: No manual configuration needed for deployments

## For Cloudflare Pages

If deploying via Cloudflare Pages dashboard (not the script):

1. Go to your Pages project settings
2. Navigate to **Settings → Environment Variables → Build**
3. Add: `VITE_GOOGLE_CLIENT_ID` = `272719199106-9hpeemg60nqoph9t52audf6hmri27mb6.apps.googleusercontent.com`

However, this is **optional** because the hardcoded fallback in `src/config/google-oauth.ts` will work automatically.

## Verification

After deployment, check the browser console. You should see:
- No warnings about missing `VITE_GOOGLE_CLIENT_ID`
- Google Sign-In button should work

If you see errors, check:
1. The config file exists: `src/config/google-oauth.ts`
2. The client ID value is correct
3. The build completed successfully




