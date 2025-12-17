import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../state/AuthContext';
import { navigateTo } from '../utils/navigation';

// Mock navigation
vi.mock('../utils/navigation', () => ({
  navigateTo: vi.fn(),
}));

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockClear();
  });

  it('checkAuth should set user if authenticated', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', username: 'tester' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.requiresUsername).toBe(false);
  });

  it('checkAuth should clear state if 401', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('checkAuth should set requiresUsername if missing username', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', username: null };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.requiresUsername).toBe(true);
  });

  it('handleGoogleSignIn should login and redirect', async () => {
    // Initial checkAuth call (fail it so we start clean)
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock login response
    const mockUser = { id: '1', email: 'test@test.com', username: 'tester' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    await act(async () => {
      await result.current.handleGoogleSignIn('id-token');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(navigateTo).toHaveBeenCalledWith('/');
  });

  it('handleGoogleSignIn should handle failure', async () => {
    // Initial checkAuth
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock login failure
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Auth Failed' }),
    });

    await expect(act(async () => {
      await result.current.handleGoogleSignIn('bad-token');
    })).rejects.toThrow('Auth Failed');

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout should clear state and redirect', async () => {
    // Initial checkAuth success
    const mockUser = { id: '1', username: 'tester' };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUser }) });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    // Mock logout success
    fetchMock.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(navigateTo).toHaveBeenCalledWith('/login');
  });

  it('setUsername should update user', async () => {
    // Initial checkAuth success but no username
    const mockUserNoName = { id: '1', username: null };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUserNoName }) });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.requiresUsername).toBe(true));

    // Mock setUsername response
    const mockUserWithName = { id: '1', username: 'newname' };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUserWithName }) });

    await act(async () => {
      await result.current.setUsername('newname');
    });

    expect(result.current.user).toEqual(mockUserWithName);
    expect(result.current.requiresUsername).toBe(false);
  });

  it('setUsername handles 409 by refreshing auth', async () => {
    // Initial checkAuth success but no username
    const mockUserNoName = { id: '1', username: null };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUserNoName }) });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.requiresUsername).toBe(true));

    // Mock 409
    fetchMock.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) });

    // Mock checkAuth inside logic
    const mockUserWithName = { id: '1', username: 'existing' };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUserWithName }) });

    await act(async () => {
      await result.current.setUsername('existing');
      expect(fetchMock).toHaveBeenCalledTimes(3); // init + set(fail) + checkAuth
    });
  });

  it('setUsername handles generic error', async () => {
    const mockUserNoName = { id: '1', username: null };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUserNoName }) });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.requiresUsername).toBe(true));

    fetchMock.mockRejectedValueOnce(new Error('Network Fail'));

    await expect(act(async () => {
      await result.current.setUsername('fail');
    })).rejects.toThrow('Network Fail');
  });

  it('logout handles error gracefully', async () => {
    const mockUser = { id: '1', username: 'tester' };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUser }) });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    fetchMock.mockRejectedValueOnce(new Error('Logout Fail'));

    await act(async () => {
      await result.current.logout();
    });
    // Should still clear state
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('useAuth throws if used outside provider', () => {
    // Suppress console.error for this test as React logs errors when boundary catches
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');

    consoleSpy.mockRestore();
  });
});
