# Stockly Webapp E2E Tests

End-to-end tests for the Stockly webapp using Playwright.

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install
   ```

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests in UI Mode
```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### Run Tests in Headed Mode
```bash
npm run test:e2e:headed
```

### Run Tests for Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

```
e2e/
├── tests/
│   ├── auth.spec.ts          # Authentication tests
│   ├── dashboard.spec.ts      # Dashboard tests
│   ├── alerts.spec.ts         # Alerts tests
│   └── settings.spec.ts       # Settings tests
├── fixtures/
│   └── test-data.ts           # Test data fixtures
└── utils/
    └── helpers.ts             # Test utilities
```

## Writing Tests

Example test file (`e2e/tests/dashboard.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display stock cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.stock-card')).toBeVisible();
  });
});
```

## Configuration

Configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:5173` (development)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure

## Visual Regression Testing

Playwright supports visual regression testing:

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot();
});
```

## Accessibility Testing

Playwright can test accessibility:

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
```

## Troubleshooting

1. **Tests fail locally**: Ensure dev server is running (`npm run dev`)
2. **Browser not found**: Run `npx playwright install`
3. **Timeout errors**: Increase timeout in test or config
4. **Flaky tests**: Add wait conditions or increase retries



