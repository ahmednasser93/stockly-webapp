/**
 * useAlerts Hook Tests
 * 
 * Tests for the alerts management hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockAlerts } from '../utils/factories';
import { useAlerts } from '../../hooks/useAlerts';
import { SettingsProvider } from '../../state/SettingsContext';
import * as alertsApi from '../../api/alerts';

// Mock the alerts API
vi.mock('../../api/alerts', () => ({
  listAlerts: vi.fn(),
  createAlert: vi.fn(),
  updateAlert: vi.fn(),
  deleteAlert: vi.fn(),
}));

// Mock SettingsContext
vi.mock('../../state/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useSettings: () => ({ cacheStaleTimeMinutes: 5 }),
}));

describe('useAlerts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should fetch alerts on mount', async () => {
    const mockAlerts = createMockAlerts(3);
    
    vi.mocked(alertsApi.listAlerts).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.alerts).toEqual(mockAlerts);
  });

  it('should handle create alert mutation', async () => {
    const mockAlert = { id: 'alert-1', symbol: 'AAPL', direction: 'above', threshold: 150 };
    vi.mocked(alertsApi.createAlert).mockResolvedValue(mockAlert);
    vi.mocked(alertsApi.listAlerts).mockResolvedValue([]);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createAlert({
      symbol: 'AAPL',
      direction: 'above',
      threshold: 150,
    });

    // React Query mutations call the function with the data as first argument
    // Check that createAlert was called with the correct data (React Query may pass additional context)
    expect(alertsApi.createAlert).toHaveBeenCalled();
    const callArgs = vi.mocked(alertsApi.createAlert).mock.calls[0][0];
    expect(callArgs).toMatchObject({
      symbol: 'AAPL',
      direction: 'above',
      threshold: 150,
    });
  });

  it('should handle delete alert mutation', async () => {
    vi.mocked(alertsApi.deleteAlert).mockResolvedValue(undefined);
    vi.mocked(alertsApi.listAlerts).mockResolvedValue([]);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.deleteAlert('alert-1');

    // Check that deleteAlert was called with the correct id (React Query may pass additional context)
    expect(alertsApi.deleteAlert).toHaveBeenCalled();
    const callArgs = vi.mocked(alertsApi.deleteAlert).mock.calls[0][0];
    expect(callArgs).toBe('alert-1');
  });
});

