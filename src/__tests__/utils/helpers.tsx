/**
 * Test Helper Functions
 * 
 * Utility functions for common test operations
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SettingsProvider } from '../../state/SettingsContext';

/**
 * Create a test QueryClient with default options
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Render a component with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(SettingsProvider, null, children)
      )
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Wait for a specified amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for an element to appear
 */
export async function waitForElement(
  callback: () => HTMLElement | null,
  timeout: number = 5000,
): Promise<HTMLElement> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = callback();
    if (element) {
      return element;
    }
    await wait(100);
  }
  throw new Error('Element not found within timeout');
}

/**
 * Mock window.location
 */
export function mockWindowLocation(url: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).location;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.location = new URL(url) as any;
}

/**
 * Mock fetch
 */
export function mockFetch(response: unknown, ok: boolean = true) {
  if (typeof globalThis !== 'undefined') {
    (globalThis as { fetch: typeof fetch }).fetch = vi.fn().mockResolvedValue({
      ok,
      json: async () => response,
      text: async () => JSON.stringify(response),
      status: ok ? 200 : 500,
      statusText: ok ? 'OK' : 'Internal Server Error',
    } as Response);
  }
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
}


