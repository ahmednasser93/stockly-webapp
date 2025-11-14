# Stockly Webapp - Deployment Guide

## 🚀 Quick Deploy

### Option 1: Cloudflare Pages (Recommended)

```bash
# Build the app
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

---

## 📋 Deployment Options

### 1️⃣ Cloudflare Pages (Production)

**Prerequisites:**
- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`
- Logged in: `wrangler login`

**Steps:**

```bash
# 1. Build the app (runs tests automatically)
npm run build

# 2. Deploy to production
wrangler pages deploy dist \
  --project-name stockly-webapp \
  --functions functions \
  --branch production

# 3. Your app will be live at:
# https://stockly-webapp.pages.dev
```

**Set Secrets (if needed):**
```bash
# Login credentials for the app
wrangler pages secret put STOCKLY_USERNAME --project-name stockly-webapp
wrangler pages secret put STOCKLY_PASS --project-name stockly-webapp

# Optional: Override API URL
wrangler pages secret put VITE_API_BASE_URL --project-name stockly-webapp
```

---

### 2️⃣ Cloudflare Pages (Preview/Staging)

Deploy to a preview branch for testing:

```bash
npm run build

wrangler pages deploy dist \
  --project-name stockly-webapp \
  --functions functions \
  --branch staging

# Preview URL: https://staging.stockly-webapp.pages.dev
```

---

### 3️⃣ Vercel

**Prerequisites:**
- Vercel account
- Vercel CLI: `npm install -g vercel`

**Steps:**

```bash
# 1. Build the app
npm run build

# 2. Deploy
vercel --prod

# Or use the Vercel dashboard:
# 1. Connect your GitHub repo
# 2. Set build command: npm run build
# 3. Set output directory: dist
# 4. Deploy
```

**Environment Variables (Vercel Dashboard):**
- `VITE_API_BASE_URL` (optional)
- `STOCKLY_USERNAME`
- `STOCKLY_PASS`

---

### 4️⃣ Netlify

**Prerequisites:**
- Netlify account
- Netlify CLI: `npm install -g netlify-cli`

**Steps:**

```bash
# 1. Build the app
npm run build

# 2. Deploy
netlify deploy --prod --dir=dist

# Or use Netlify dashboard:
# 1. Connect your GitHub repo
# 2. Build command: npm run build
# 3. Publish directory: dist
# 4. Deploy
```

**Environment Variables (Netlify Dashboard):**
- `VITE_API_BASE_URL` (optional)
- `VITE_STOCKLY_USERNAME`
- `VITE_STOCKLY_PASS`

---

### 5️⃣ GitHub Pages

**Prerequisites:**
- GitHub repository
- GitHub Actions enabled

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Configure in GitHub:**
1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages
4. Save

---

### 6️⃣ Docker Container

**Create `Dockerfile`:**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Create `nginx.conf`:**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and Run:**

```bash
# Build Docker image
docker build -t stockly-webapp .

# Run container
docker run -p 8080:80 stockly-webapp

# Access at http://localhost:8080
```

---

### 7️⃣ AWS S3 + CloudFront

**Prerequisites:**
- AWS account
- AWS CLI configured

**Steps:**

```bash
# 1. Build the app
npm run build

# 2. Create S3 bucket
aws s3 mb s3://stockly-webapp

# 3. Upload files
aws s3 sync dist/ s3://stockly-webapp --delete

# 4. Configure bucket for static hosting
aws s3 website s3://stockly-webapp \
  --index-document index.html \
  --error-document index.html

# 5. Make bucket public
aws s3api put-bucket-policy \
  --bucket stockly-webapp \
  --policy file://bucket-policy.json

# 6. Create CloudFront distribution (optional, for CDN)
```

---

### 8️⃣ Mobile Apps (Capacitor)

**For Android APK and iOS Bundle:**

**Prerequisites:**
- Capacitor installed: `npm install @capacitor/core @capacitor/cli`
- Android Studio (for Android)
- Xcode (for iOS)

**Steps:**

```bash
# 1. Build the web app
npm run build

# 2. Initialize Capacitor (first time only)
npx cap init stockly-webapp com.stockly.app

# 3. Add platforms
npx cap add android
npx cap add ios

# 4. Copy web assets to native projects
npx cap copy

# 5. Open in native IDE
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode

# 6. Build APK/IPA from the IDE
```

**Android APK:**
1. Open in Android Studio
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. APK located in `android/app/build/outputs/apk/`

**iOS Bundle:**
1. Open in Xcode
2. Product → Archive
3. Distribute App → Ad Hoc / App Store

---

## 🔧 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No linter errors: `npm run lint`
- [ ] Environment variables configured (if needed)
- [ ] Backend API is accessible
- [ ] CORS is configured on backend
- [ ] Secrets are set (for protected routes)

---

## 🌍 Environment Variables

### Required (for login functionality)
```bash
STOCKLY_USERNAME=your-username
STOCKLY_PASS=your-password
```

### Optional
```bash
# Override API URL (defaults to production URL in builds)
VITE_API_BASE_URL=https://your-api.example.com

# Separate admin API
VITE_ADMIN_API_BASE_URL=https://admin-api.example.com
```

---

## 🔐 Setting Secrets

### Cloudflare Pages
```bash
wrangler pages secret put STOCKLY_USERNAME --project-name stockly-webapp
wrangler pages secret put STOCKLY_PASS --project-name stockly-webapp
```

### Vercel (via CLI)
```bash
vercel env add STOCKLY_USERNAME
vercel env add STOCKLY_PASS
```

### Netlify (via CLI)
```bash
netlify env:set STOCKLY_USERNAME "your-username"
netlify env:set STOCKLY_PASS "your-password"
```

### GitHub Actions
Add secrets in: Repository Settings → Secrets and variables → Actions

---

## 📊 Build Output

After running `npm run build`, you'll get:

```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── index-[hash].js    # JavaScript bundle (~1.7MB)
│   └── index-[hash].css   # CSS bundle (~172KB)
└── vite.svg               # Favicon
```

**Total size:** ~2MB (gzipped: ~514KB)

---

## 🚦 Deployment Verification

After deployment, verify:

1. **App loads correctly**
   ```bash
   curl -I https://your-app.pages.dev
   # Should return 200 OK
   ```

2. **API connectivity**
   - Open browser console
   - Check Network tab
   - Verify requests go to correct API URL

3. **Login works**
   - Try logging in with credentials
   - Should redirect to dashboard

4. **Alerts feature works**
   - Navigate to /alerts
   - Try creating an alert
   - Verify API calls succeed

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions (Cloudflare Pages)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: stockly-webapp
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
image: node:20

stages:
  - test
  - build
  - deploy

cache:
  paths:
    - node_modules/

test:
  stage: test
  script:
    - npm ci
    - npm run test

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - npm install -g wrangler
    - wrangler pages deploy dist --project-name stockly-webapp
  only:
    - main
```

---

## 🐛 Troubleshooting

### Build fails with "Tests failed"
```bash
# Run tests to see what's failing
npm run test

# Fix failing tests, then rebuild
npm run build
```

### "Cannot connect to API" after deployment
- Check browser console for CORS errors
- Verify API URL is correct (should be production URL)
- Ensure backend API is accessible from your deployment

### Login not working
- Verify secrets are set correctly
- Check `/api/login` function is deployed
- Ensure `functions/` directory is included in deployment

### 404 on page refresh
- Configure SPA fallback to `index.html`
- For Nginx: `try_files $uri $uri/ /index.html;`
- For Cloudflare Pages: Automatic
- For Vercel: Create `vercel.json` with rewrites

### Environment variables not working
- Ensure variables are prefixed with `VITE_`
- Restart dev server after changing `.env`
- Rebuild for production: `npm run build`

---

## 📈 Performance Optimization

### Enable Compression
Most platforms enable gzip/brotli automatically. Verify:
```bash
curl -H "Accept-Encoding: gzip" -I https://your-app.pages.dev
# Should include: Content-Encoding: gzip
```

### CDN Configuration
- Cloudflare Pages: Automatic CDN
- Vercel: Automatic Edge Network
- Netlify: Automatic CDN
- AWS: Use CloudFront

### Caching Headers
Static assets are cached automatically. For custom headers:

**Cloudflare Pages** (`_headers` file in `public/`):
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 🎯 Recommended Deployment

For the best experience, we recommend **Cloudflare Pages**:

✅ **Free tier available**  
✅ **Automatic HTTPS**  
✅ **Global CDN**  
✅ **Functions support** (for `/api/login`)  
✅ **Preview deployments**  
✅ **Easy secrets management**  
✅ **Fast builds**  

**One-command deploy:**
```bash
npm run deploy:prod
```

This runs tests, builds, and deploys to Cloudflare Pages production.

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review build logs for errors
3. Verify environment variables are set
4. Test locally first: `npm run build && npm run preview`
5. Check backend API is accessible

---

**Last Updated**: November 14, 2025  
**Deployment Platforms Tested**: Cloudflare Pages, Vercel, Netlify  
**Build Tool**: Vite 7.2.2  
**Node Version**: 20.x recommended

