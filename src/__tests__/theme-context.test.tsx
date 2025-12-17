
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '../state/ThemeContext';

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        // Mock matchMedia
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
    });

    it('uses system preference (light) by default if no storage', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
        expect(result.current.theme).toBe('sunrise');
        expect(document.documentElement.getAttribute('data-theme')).toBe('sunrise');
    });

    it('uses system preference (dark) if matches', () => {
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-color-scheme: dark)',
            media: query,
            // ...
        }));

        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
        expect(result.current.theme).toBe('aurora');
    });

    it('reads from local storage', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'aurora');
        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
        expect(result.current.theme).toBe('aurora');
    });

    it('toggles theme', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
        expect(result.current.theme).toBe('sunrise');

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('aurora');
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('aurora');
        expect(document.documentElement.getAttribute('data-theme')).toBe('aurora');

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('sunrise');
    });

    it('sets specific theme', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

        act(() => {
            result.current.setTheme('aurora');
        });

        expect(result.current.theme).toBe('aurora');
    });

    it('throws if used outside provider', () => {
        // Suppress console error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used inside ThemeProvider');
        consoleSpy.mockRestore();
    });
});
