/**
 * AlertForm Component Tests
 * 
 * Tests for the alert creation/edit form component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders } from '../utils/helpers';
import { createMockAlert } from '../utils/factories';
import { AlertForm } from '../../components/AlertForm';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';

describe('AlertForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with all fields', () => {
    const { getByLabelText } = renderWithProviders(
      <AlertForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );

    expect(getByLabelText(/symbol/i)).toBeInTheDocument();
    expect(getByLabelText(/threshold/i)).toBeInTheDocument();
    expect(getByLabelText(/direction/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithProviders(
      <AlertForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );

    const submitButton = getByRole('button', { name: /create/i });
    await user.click(submitButton);

    // Should show validation errors
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const { getByLabelText, getByRole } = renderWithProviders(
      <AlertForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );

    await user.type(getByLabelText(/symbol/i), 'AAPL');
    await user.type(getByLabelText(/threshold/i), '150');
    const aboveRadio = screen.getByRole('radio', { name: /above/i });
    await user.click(aboveRadio);
    
    const submitButton = getByRole('button', { name: /create/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: 'AAPL',
        threshold: 150,
        direction: 'above',
      })
    );
  });

  it('should pre-fill form when editing', () => {
    const alert = createMockAlert({
      symbol: 'AAPL',
      threshold: 150,
      direction: 'above',
    });

    const { getByLabelText } = renderWithProviders(
      <AlertForm 
        alert={alert}
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    expect(getByLabelText(/symbol/i)).toHaveValue('AAPL');
    expect(getByLabelText(/threshold/i)).toHaveValue(150);
  });

  it('should handle cancel action', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithProviders(
      <AlertForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />
    );

    const cancelButton = getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});

