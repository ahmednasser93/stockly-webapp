/**
 * StockCard Component Tests
 * 
 * Tests for the stock card component
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../utils/helpers';
import { createMockStockQuote } from '../utils/factories';
import { StockCard } from '../../components/StockCard';

describe('StockCard', () => {
  it('should render stock information', () => {
    const stock = createMockStockQuote('AAPL', {
      price: 100.0,
      dayLow: 90.0,
      dayHigh: 110.0,
    });

    const { getByText } = renderWithProviders(<StockCard quote={stock} />);

    expect(getByText('AAPL')).toBeInTheDocument();
    expect(getByText('$100.00')).toBeInTheDocument();
  });

  it('should display range percentage correctly', () => {
    const stock = createMockStockQuote('GOOGL', {
      price: 105.0,
      dayLow: 100.0,
      dayHigh: 110.0,
    });

    const { getByText } = renderWithProviders(<StockCard quote={stock} />);

    // StockCard shows range percentage: (price - dayLow) / (dayHigh - dayLow) * 100
    // (105 - 100) / (110 - 100) * 100 = 50.0%
    expect(getByText('50.0%')).toBeInTheDocument();
  });

  it('should render as a link to stock details', () => {
    const stock = createMockStockQuote('AAPL');

    const { container } = renderWithProviders(
      <StockCard quote={stock} />
    );

    // StockCard is wrapped in a Link component
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('href')).toContain('/stocks/AAPL');
  });
});

