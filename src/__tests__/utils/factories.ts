/**
 * Test Data Factories
 * 
 * Factories for creating test data objects used across webapp tests
 */

/**
 * Create mock stock quote data
 */
export function createMockStockQuote(symbol: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    symbol,
    name: `${symbol} Inc.`,
    price: 100.0,
    change: 1.5,
    changePercent: 1.5,
    dayLow: 95.0,
    dayHigh: 105.0,
    volume: 1000000,
    marketCap: 1000000000,
    pe: 25.0,
    eps: 4.0,
    dividend: 2.0,
    yield: 2.0,
    timestamp: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

/**
 * Create mock stock quotes array
 */
export function createMockStockQuotes(symbols: string[] = ['AAPL', 'GOOGL', 'MSFT']) {
  return symbols.map(symbol => createMockStockQuote(symbol));
}

/**
 * Create mock alert data
 */
export function createMockAlert(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'alert-1',
    symbol: 'AAPL',
    direction: 'above',
    threshold: 150.0,
    active: true,
    currentPrice: 100.0,
    distance: 50.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock alerts array
 */
export function createMockAlerts(count: number = 3) {
  return Array.from({ length: count }, (_, i) =>
    createMockAlert({
      id: `alert-${i + 1}`,
      symbol: ['AAPL', 'GOOGL', 'MSFT'][i],
      threshold: 100 + i * 10,
    })
  );
}

/**
 * Create mock user data
 */
export function createMockUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser',
    picture: 'https://example.com/picture.jpg',
    ...overrides,
  };
}

/**
 * Create mock settings data
 */
export function createMockSettings(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    refreshInterval: 30,
    trackedSymbols: ['AAPL', 'GOOGL'],
    ...overrides,
  };
}

/**
 * Create mock news article data
 */
export function createMockNewsArticle(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: 'Test News Article',
    url: 'https://example.com/news/1',
    publishedDate: new Date().toISOString(),
    source: 'Test Source',
    symbol: 'AAPL',
    text: 'Test article content',
    image: 'https://example.com/image.jpg',
    ...overrides,
  };
}

/**
 * Create mock news articles array
 */
export function createMockNewsArticles(count: number = 10) {
  return Array.from({ length: count }, (_, i) =>
    createMockNewsArticle({
      title: `News Article ${i + 1}`,
      url: `https://example.com/news/${i + 1}`,
    })
  );
}

/**
 * Create mock API response
 */
export function createMockApiResponse<T>(data: T, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    ...overrides,
  };
}

/**
 * Create mock error response
 */
export function createMockErrorResponse(status: number = 500, message: string = 'Internal Server Error') {
  return {
    data: {
      error: {
        code: 'ERROR_CODE',
        message,
      },
    },
    status,
    statusText: 'Error',
    headers: {},
  };
}

