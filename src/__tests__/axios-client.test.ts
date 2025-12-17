
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, Mock } from 'vitest';
import axios from 'axios';

// Define mocks using vi.hoisted to survive hoisting
const mocks = vi.hoisted(() => {
    const mockFn: any = vi.fn(() => Promise.resolve({ data: 'retry-success' }));
    mockFn.interceptors = {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
    };
    mockFn.get = vi.fn();
    mockFn.post = vi.fn();
    mockFn.create = vi.fn(() => mockFn);
    return {
        mockAxiosInstance: mockFn
    };
});

const { mockAxiosInstance } = mocks;

vi.mock('axios', async (importOriginal) => {
    return {
        default: {
            create: () => mocks.mockAxiosInstance,
            isAxiosError: (payload: any) => payload?.isAxiosError === true,
        },
        AxiosError: class extends Error {
            isAxiosError = true;
            config = {};
            response = {};
            constructor(message: string, code?: string, config?: any, request?: any, response?: any) {
                super(message);
                this.config = config;
                this.response = response;
            }
        }
    };
});

// Mock navigation
vi.mock('../utils/navigation', () => ({
    navigateTo: vi.fn(),
}));

import { navigateTo } from '../utils/navigation';

// Import after mock
import { axiosClient } from '../api/axios-client';

// Mock fetch global for the refresh call
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('axios-client', () => {
    // Variable to hold the error interceptor logic, captured in beforeEach
    let responseInterceptorError: any;

    beforeAll(() => {
        // Capture interceptors once, as they are registered on module load
        const responseUseCalls = (mocks.mockAxiosInstance.interceptors.response.use as Mock).mock.calls;
        if (responseUseCalls.length > 0) {
            responseInterceptorError = responseUseCalls[0][1];
        }
    });

    beforeEach(() => {
        fetchMock.mockClear();
        (navigateTo as Mock).mockClear();
        // Do not use vi.clearAllMocks() as it clears the interceptors registration history if we needed to check it again
        // But since we captured the function, we are good.
        // If we want to verify calling axiosInstance, we might need to clear that specifically.
        (mocks.mockAxiosInstance as unknown as Mock).mockClear();
    });

    // Verification that mocking worked
    it('should have interceptors registered', () => {
        expect(axiosClient.interceptors.request.use).toHaveBeenCalled();
        expect(axiosClient.interceptors.response.use).toHaveBeenCalled();
    });

    it('should refresh token on 401', async () => {
        const config = { _retry: false, headers: {} };
        const error = {
            config,
            response: { status: 401 },
            isAxiosError: true
        };

        // Mock successful refresh
        fetchMock.mockResolvedValueOnce({ ok: true });

        // The interceptor should call axiosClient(config) which is our mockAxiosInstance
        await responseInterceptorError(error);

        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/refresh'), expect.anything());
        expect(mockAxiosInstance).toHaveBeenCalledWith(config);
    });

    it('should queue requests while refreshing', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true });
        const config1 = { _retry: false, url: '1' };
        const config2 = { _retry: false, url: '2' };

        const promise1 = responseInterceptorError({ config: config1, response: { status: 401 }, isAxiosError: true });
        const promise2 = responseInterceptorError({ config: config2, response: { status: 401 }, isAxiosError: true });

        await Promise.all([promise1, promise2]);

        expect(fetchMock).toHaveBeenCalledTimes(1); // Only 1 refresh call
        expect(mockAxiosInstance).toHaveBeenCalledTimes(2); // 2 retries
    });

    it('should redirect to login on refresh failure', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false }); // Refresh fails

        const config = { _retry: false };
        try {
            await responseInterceptorError({ config, response: { status: 401 }, isAxiosError: true });
        } catch (e) {
            // expected
        }

        expect(navigateTo).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login on refresh network error', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network'));

        const config = { _retry: false };
        try {
            await responseInterceptorError({ config, response: { status: 401 }, isAxiosError: true });
        } catch (e) {
            // expected
        }

        expect(navigateTo).toHaveBeenCalledWith('/login');
    });
});

