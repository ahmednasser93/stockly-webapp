#!/bin/bash

# Stockly Webapp Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: production, staging, preview

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-production}"
PROJECT_NAME="stockly-webapp"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Stockly Webapp Deployment Script                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found${NC}"
    echo -e "${YELLOW}Install with: npm install -g wrangler${NC}"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare${NC}"
    echo -e "${BLUE}Logging in...${NC}"
    wrangler login
fi

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "   Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "   Project: ${GREEN}${PROJECT_NAME}${NC}"
echo ""

# Step 1: Run tests
echo -e "${BLUE}🧪 Step 1/4: Running tests...${NC}"
if npm run test; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed. Fix errors before deploying.${NC}"
    exit 1
fi
echo ""

# Step 2: Build
echo -e "${BLUE}🔨 Step 2/4: Building application...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 3: Check build output
echo -e "${BLUE}📊 Step 3/4: Checking build output...${NC}"
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    echo -e "   Build size: ${GREEN}${DIST_SIZE}${NC}"
    echo -e "${GREEN}✅ Build output verified${NC}"
else
    echo -e "${RED}❌ dist/ directory not found${NC}"
    exit 1
fi
echo ""

# Step 4: Deploy
echo -e "${BLUE}🚀 Step 4/4: Deploying to Cloudflare Pages...${NC}"

case $ENVIRONMENT in
    production)
        BRANCH="production"
        echo -e "${YELLOW}⚠️  Deploying to PRODUCTION${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;
    staging)
        BRANCH="staging"
        ;;
    preview)
        BRANCH="preview"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
        echo -e "${YELLOW}Valid options: production, staging, preview${NC}"
        exit 1
        ;;
esac

if wrangler pages deploy dist \
    --project-name "$PROJECT_NAME" \
    --functions functions \
    --branch "$BRANCH"; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✅ Deployment Successful!                        ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}🌐 Your app is live at:${NC}"
    
    case $ENVIRONMENT in
        production)
            echo -e "   ${GREEN}https://${PROJECT_NAME}.pages.dev${NC}"
            ;;
        staging)
            echo -e "   ${GREEN}https://staging.${PROJECT_NAME}.pages.dev${NC}"
            ;;
        preview)
            echo -e "   ${GREEN}https://preview.${PROJECT_NAME}.pages.dev${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo -e "   1. Verify the deployment in your browser"
    echo -e "   2. Test the alerts feature"
    echo -e "   3. Check API connectivity"
    echo ""
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi


