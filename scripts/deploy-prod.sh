#!/bin/bash

# ==============================================================================
# Stockly Web App Production Deployment Script
# ==============================================================================
# Runs linting (with warnings), tests, builds, and deploys the web app
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBAPP_DIR="$(dirname "$SCRIPT_DIR")"

cd "$WEBAPP_DIR"

echo "🚀 Deploying Stockly Web App to Production"
echo "================================================"
echo ""

echo "🔍 Running Linter..."
echo "------------------------------------------------"
set +e  # Temporarily disable exit on error for linting
npm run lint
LINT_EXIT_CODE=$?
set -e  # Re-enable exit on error
if [ $LINT_EXIT_CODE -eq 0 ]; then
  echo "✅ Linting passed"
else
  echo ""
  echo "⚠️  Linting found issues (continuing with deployment)"
  echo "   Note: Some linting errors are non-blocking"
fi
echo ""

echo "🧪 Running Tests..."
echo "------------------------------------------------"
npm run test || {
  echo "❌ Tests failed. Aborting deployment."
  exit 1
}
echo "✅ Tests passed"
echo ""

echo "🔨 Building Web App..."
echo "------------------------------------------------"
npm run build || {
  echo "❌ Build failed. Aborting deployment."
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

