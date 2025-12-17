/**
 * Dashboard E2E Tests
 * 
 * End-to-end tests for dashboard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    // Set up authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 'user-123', username: 'testuser' },
        accessToken: 'mock-token',
      }));
    });
    await page.reload();
  });

  test('should display dashboard with tracked stocks', async ({ page }) => {
    // Mock API response
    await page.route('**/get-stocks*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          { symbol: 'AAPL', price: 100, change: 1.5 },
          { symbol: 'GOOGL', price: 200, change: -2.0 },
        ]),
      });
    });

    await page.goto('/');

    // Should display stock cards
    await expect(page.locator('.stock-card')).toHaveCount(2);
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=GOOGL')).toBeVisible();
  });

  test('should add stock to watchlist', async ({ page }) => {
    await page.goto('/');

    // Mock search
    await page.route('**/search-stock*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          { symbol: 'MSFT', name: 'Microsoft Corporation' },
        ]),
      });
    });

    // Click search/add button
    const searchButton = page.locator('button:has-text("Add")');
    await searchButton.click();

    // Enter symbol
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('MSFT');

    // Select from results
    await page.locator('text=Microsoft Corporation').click();

    // Should add to watchlist
    await expect(page.locator('text=MSFT')).toBeVisible();
  });

  test('should remove stock from watchlist', async ({ page }) => {
    // Setup: Add stock first
    await page.goto('/');
    
    // Mock initial stocks
    await page.route('**/get-stocks*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          { symbol: 'AAPL', price: 100 },
        ]),
      });
    });

    await page.reload();

    // Remove stock (swipe or delete button)
    const stockCard = page.locator('.stock-card:has-text("AAPL")');
    await stockCard.hover();
    
    const deleteButton = page.locator('button[aria-label="Delete"]');
    await deleteButton.click();

    // Should remove from watchlist
    await expect(page.locator('text=AAPL')).not.toBeVisible();
  });

  test('should refresh stock prices', async ({ page }) => {
    await page.goto('/');

    let callCount = 0;
    await page.route('**/get-stocks*', (route) => {
      callCount++;
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          { symbol: 'AAPL', price: 100 + callCount },
        ]),
      });
    });

    // Click refresh button
    const refreshButton = page.locator('button[aria-label="Refresh"]');
    await refreshButton.click();

    // Should fetch new prices
    await expect(page.locator('text=101')).toBeVisible();
  });
});



