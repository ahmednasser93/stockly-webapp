import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFavoriteStocks, updateFavoriteStocks, deleteFavoriteStock } from '../api/favoriteStocks';
import { fetchStockNews, fetchMultipleStockNews } from '../api/news';
import { fetchStockDetails } from '../api/stockDetails';
// Note: searchSymbols, fetchStocks, and API_BASE_URL are imported but not used in these tests
import { getAdminConfig, updateAdminConfig, getMonitoringSnapshot, fetchOpenApiSpec, simulateProviderFailure, disableProviderFailure } from '../api/adminConfig';

// Mock fetch global
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API Modules', () => {
    beforeEach(() => {
        fetchMock.mockClear();
        // Reset env mocks if any (not easily possible with import.meta, so assuming default or using vi.mock for module level if needed)
    });

    describe('favoriteStocks', () => {
        it('getFavoriteStocks should return stocks on success', async () => {
            const mockStocks = [{ symbol: 'AAPL', displayOrder: 1, createdAt: '', updatedAt: '' }];
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ stocks: mockStocks }),
            });

            const result = await getFavoriteStocks();
            expect(result).toEqual(mockStocks);
        });

        it('getFavoriteStocks should return empty on 401', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 401,
            });

            const result = await getFavoriteStocks();
            expect(result).toEqual([]);
        });

        it('getFavoriteStocks should throw on other errors', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(getFavoriteStocks()).rejects.toThrow('Failed to fetch favorite stocks: Internal Server Error');
        });

        it('updateFavoriteStocks should success', async () => {
            const mockResponse = { success: true, message: 'Updated', stocks: [] };
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

            const result = await updateFavoriteStocks(['AAPL']);
            expect(result).toEqual(mockResponse);
        });

        it('updateFavoriteStocks should throw on error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Bad Request',
            });
            await expect(updateFavoriteStocks(['AAPL'])).rejects.toThrow('Failed to update favorite stocks: Bad Request');
        });

        it('deleteFavoriteStock should success', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true });
            await deleteFavoriteStock('AAPL');
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/v1/api/favorite-stocks/AAPL'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });

        it('deleteFavoriteStock should throw on error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Not Found',
            });
            await expect(deleteFavoriteStock('AAPL')).rejects.toThrow('Failed to delete favorite stock: Not Found');
        });
    });

    describe('news', () => {
        it('fetchStockNews should build URL and return news', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ news: [] }) });
            await fetchStockNews('AAPL', { page: 1, limit: 10, from: '2023-01-01', to: '2023-01-02' });

            const url = new URL(fetchMock.mock.calls[0][0]);
            expect(url.searchParams.get('symbol')).toBe('AAPL');
            expect(url.searchParams.get('page')).toBe('1');
            expect(url.searchParams.get('limit')).toBe('10');
            expect(url.searchParams.get('from')).toBe('2023-01-01');
            expect(url.searchParams.get('to')).toBe('2023-01-02');
        });

        it('fetchStockNews should handle JSON errors', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: async () => JSON.stringify({ error: 'News Error' }),
            });
            await expect(fetchStockNews('AAPL')).rejects.toThrow('News Error');
        });

        it('fetchStockNews should handle non-JSON errors', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Server fail',
            });
            await expect(fetchStockNews('AAPL')).rejects.toThrow('Server fail');
        });

        it('fetchStockNews should handle empty error text', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: async () => '',
            });
            await expect(fetchStockNews('AAPL')).rejects.toThrow('Failed to fetch news: 404');
        });

        it('fetchMultipleStockNews returns empty for 0 symbols', async () => {
            const res = await fetchMultipleStockNews([]);
            expect(res.news).toHaveLength(0);
        });

        it('fetchMultipleStockNews throws for >10 symbols', async () => {
            await expect(fetchMultipleStockNews(new Array(11).fill('A'))).rejects.toThrow();
        });

        it('fetchMultipleStockNews handles success', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ news: [] }) });
            await fetchMultipleStockNews(['AAPL', 'GOOGL']);
            expect(fetchMock).toHaveBeenCalled();
            const url = new URL(fetchMock.mock.calls[0][0]);
            expect(url.searchParams.get('symbols')).toBe('AAPL,GOOGL');
        });

        it('fetchMultipleStockNews handles JSON error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: async () => JSON.stringify({ error: 'Multi News Error' }),
            });
            await expect(fetchMultipleStockNews(['A'])).rejects.toThrow('Multi News Error');
        });

        it('fetchMultipleStockNews handles text error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Error',
            });
            await expect(fetchMultipleStockNews(['A'])).rejects.toThrow('Error');
        });
    });

    describe('stockDetails', () => {
        it('fetchStockDetails success', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
            await fetchStockDetails('AAPL');
        });

        it('fetchStockDetails JSON error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: async () => JSON.stringify({ error: 'Details Error' }),
            });
            await expect(fetchStockDetails('AAPL')).rejects.toThrow('Details Error');
        });

        it('fetchStockDetails text error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Fail',
            });
            await expect(fetchStockDetails('AAPL')).rejects.toThrow('Fail');
        });

        it('fetchStockDetails abort error', async () => {
            const abortError = new Error('AbortError');
            abortError.name = 'AbortError';
            fetchMock.mockRejectedValueOnce(abortError);
            await expect(fetchStockDetails('AAPL')).rejects.toThrow('Request timeout');
        });

        it('fetchStockDetails generic network error', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network'));
            await expect(fetchStockDetails('AAPL')).rejects.toThrow('Network');
        });
    });

    describe('adminConfig', () => {
        beforeEach(() => {
            vi.spyOn(console, 'warn').mockImplementation(() => { });
        });
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('getAdminConfig success', async () => {
            const mockConfig = { pollingIntervalSec: 10 };
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockConfig });
            const res = await getAdminConfig();
            expect(res).toEqual(mockConfig);
        });

        it('getAdminConfig failure falls back to default', async () => {
            fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
            const res = await getAdminConfig();
            expect(res.pollingIntervalSec).toBeDefined();
            expect(console.warn).toHaveBeenCalled();
        });

        it('updateAdminConfig success', async () => {
            const payload = { pollingIntervalSec: 20 };
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => payload });
            const res = await updateAdminConfig(payload);
            expect(res.pollingIntervalSec).toBe(20);
        });

        it('getMonitoringSnapshot success', async () => {
            const mockMetrics = { dbLagMs: 10 };
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockMetrics });
            const res = await getMonitoringSnapshot();
            expect(res).toEqual(mockMetrics);
        });

        it('getMonitoringSnapshot failure falls back', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Fail'));
            const res = await getMonitoringSnapshot();
            expect(res.dbLagMs).toBeDefined();
            expect(console.warn).toHaveBeenCalled();
        });

        it('fetchOpenApiSpec success', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ openapi: '3.0.0' }) });
            const res = await fetchOpenApiSpec();
            expect(res.openapi).toBe('3.0.0');
        });

        it('fetchOpenApiSpec failure throws', async () => {
            fetchMock.mockResolvedValueOnce({ ok: false });
            await expect(fetchOpenApiSpec()).rejects.toThrow('Failed to fetch OpenAPI spec');
        });

        it('simulateProviderFailure success', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ featureFlags: { simulateProviderFailure: true } }) });
            const res = await simulateProviderFailure();
            expect(res.featureFlags.simulateProviderFailure).toBe(true);
        });

        it('disableProviderFailure success', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ featureFlags: { simulateProviderFailure: false } }) });
            const res = await disableProviderFailure();
            expect(res.featureFlags.simulateProviderFailure).toBe(false);
        });
    });
});
