/**
 * Authentication E2E Tests
 * 
 * End-to-end tests for authentication flow using Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('should handle Google OAuth sign-in', async ({ page }) => {
    // Mock Google OAuth
    await page.route('**/auth/google', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { id: 'user-123', email: 'test@example.com' },
          requiresUsername: false,
        }),
      });
    });

    // Click sign-in button
    const signInButton = page.locator('button:has-text("Sign in with Google")');
    await signInButton.click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should redirect to username selection if username required', async ({ page }) => {
    // Mock Google OAuth returning requiresUsername: true
    await page.route('**/auth/google', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { id: 'user-123', email: 'test@example.com', username: null },
          requiresUsername: true,
        }),
      });
    });

    // Click sign-in button
    const signInButton = page.locator('button:has-text("Sign in with Google")');
    await signInButton.click();

    // Should redirect to username selection
    await expect(page).toHaveURL('/username');
  });

  test('should validate username format', async ({ page }) => {
    // Navigate to username selection
    await page.goto('/username');

    // Try invalid username
    const usernameInput = page.locator('input[type="text"]');
    await usernameInput.fill('ab'); // Too short

    // Should show validation error
    await expect(page.locator('text=Username must be')).toBeVisible();
  });

  test('should check username availability', async ({ page }) => {
    await page.goto('/username');

    // Mock availability check
    await page.route('**/auth/username/check*', (route) => {
      const url = new URL(route.request().url());
      const username = url.searchParams.get('username');
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          available: username !== 'taken',
        }),
      });
    });

    const usernameInput = page.locator('input[type="text"]');
    await usernameInput.fill('newuser');

    // Wait for availability check
    await page.waitForTimeout(500);

    // Should show availability status
    await expect(page.locator('text=available')).toBeVisible();
  });
});


