#!/bin/bash

# ==============================================================================
# Stockly Web App Production Deployment Script
# ==============================================================================
# Runs tests (REQUIRED), linting (REQUIRED), builds, and deploys the web app
# Tests and linting MUST pass or deployment will be aborted
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBAPP_DIR="$(dirname "$SCRIPT_DIR")"

cd "$WEBAPP_DIR"

echo "🚀 Deploying Stockly Web App to Production"
echo "================================================"
echo ""

# Check if SKIP_TESTS environment variable is set (for emergency overrides only)
if [ "${SKIP_TESTS}" = "true" ]; then
  echo "⚠️  WARNING: SKIP_TESTS is set to true. Skipping tests (NOT RECOMMENDED)."
  echo "   This should only be used in emergency situations."
  echo ""
else
  echo "🧪 Running Tests (REQUIRED - deployment will abort on failure)..."
  echo "------------------------------------------------"
  if ! npm run test; then
    echo ""
    echo "❌ ❌ ❌ TESTS FAILED ❌ ❌ ❌"
    echo "   Deployment aborted. Please fix all failing tests before deploying."
    echo "   Run 'npm run test' to see detailed test output."
    exit 1
  fi
  echo "✅ All tests passed"
  echo ""
fi

echo "🔍 Running Linter (REQUIRED - deployment will abort on failure)..."
echo "------------------------------------------------"
if ! npm run lint; then
  echo ""
  echo "❌ ❌ ❌ LINTING FAILED ❌ ❌ ❌"
  echo "   Deployment aborted. Please fix all linting errors before deploying."
  echo "   Run 'npm run lint' to see detailed linting output."
  exit 1
fi
echo "✅ Linting passed"
echo ""

echo "🔨 Building Web App..."
echo "------------------------------------------------"

# Google OAuth Client ID - will be used from .env.production or config file
# The config file (src/config/google-oauth.ts) has a hardcoded fallback,
# so the build will always work even if env var is not set
PRODUCTION_CLIENT_ID="272719199106-9hpeemg60nqoph9t52audf6hmri27mb6.apps.googleusercontent.com"

# Set VITE_GOOGLE_CLIENT_ID if not already set (for explicit override)
if [ -z "$VITE_GOOGLE_CLIENT_ID" ]; then
  export VITE_GOOGLE_CLIENT_ID="$PRODUCTION_CLIENT_ID"
  echo "✅ Using production Google Client ID: $PRODUCTION_CLIENT_ID"
  echo "   (This is also configured in .env.production and src/config/google-oauth.ts as fallback)"
else
  echo "✅ Using VITE_GOOGLE_CLIENT_ID from environment: $VITE_GOOGLE_CLIENT_ID"
fi
echo ""

# Build with environment variable
# Note: The build command also runs tests internally as a safety check
# Note: Vite will also read from .env.production automatically
echo "   Note: Build process will run tests again as a safety check"
VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID}" npm run build || {
  echo ""
  echo "❌ Build failed. Aborting deployment."
  echo "   This may be due to test failures, TypeScript errors, or build issues."
  exit 1
}
echo "✅ Build complete"
echo ""

echo "📤 Deploying to Cloudflare Pages..."
echo "------------------------------------------------"
wrangler pages deploy dist --project-name stockly-webapp --branch production || {
  echo "❌ Deployment failed."
  exit 1
}

echo ""
echo "✅ Web App Deployment Complete"
echo "🌐 Web App URL: https://db442039.stockly-webapp.pages.dev"
echo ""

