/**
 * Test Configuration
 * 
 * Configuration constants and settings for tests
 */

/**
 * Test environment configuration
 */
export const TEST_CONFIG = {
  // API Configuration
  API_BASE_URL: (import.meta.env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8787',
  
  // Test User
  TEST_USERNAME: (import.meta.env?.TEST_USERNAME as string | undefined) || 'testuser',
  TEST_EMAIL: (import.meta.env?.TEST_EMAIL as string | undefined) || 'test@example.com',
  TEST_USER_ID: (import.meta.env?.TEST_USER_ID as string | undefined) || 'user-123',
  
  // Test Data
  TEST_SYMBOLS: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'],
  
  // Timeouts
  DEFAULT_TIMEOUT: 5000,
  LONG_TIMEOUT: 10000,
  
  // Test Flags
  VERBOSE_LOGGING: (import.meta.env?.VERBOSE_LOGGING as string | undefined) === 'true',
  MOCK_API: (import.meta.env?.MOCK_API as string | undefined) !== 'false',
};

/**
 * Get test environment variable
 */
export function getTestEnv(key: keyof typeof TEST_CONFIG): string | number | boolean | string[] {
  return TEST_CONFIG[key];
}

/**
 * Reset test configuration
 */
export function resetTestConfig() {
  // Clear any cached values if needed
}


