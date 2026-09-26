import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminConfirmDialog from '../AdminConfirmDialog';

// useFocusTrap returns a ref; provide a minimal stub so the component mounts
// without a full DOM focus-trap implementation in jsdom.
vi.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}));

describe('AdminConfirmDialog', () => {
  const defaultProps = {
    title: 'Pause protocol',
    description: 'This will halt all new invoice submissions immediately.',
    confirmLabel: 'Pause protocol',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the provided title and description', () => {
    render(<AdminConfirmDialog {...defaultProps} />);
    // The title appears in both the <h2> and the confirm button — query by role
    // to target the heading specifically.
    expect(screen.getByRole('heading', { name: 'Pause protocol' })).toBeInTheDocument();
    expect(
      screen.getByText('This will halt all new invoice submissions immediately.')
    ).toBeInTheDocument();
  });

  it('uses the confirmLabel for the confirm button', () => {
    render(<AdminConfirmDialog {...defaultProps} confirmLabel="Drain insurance pool" />);
    expect(screen.getByRole('button', { name: 'Drain insurance pool' })).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    render(<AdminConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: defaultProps.confirmLabel }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    render(<AdminConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('has correct ARIA attributes for accessibility', () => {
    render(<AdminConfirmDialog {...defaultProps} />);
    const dialog = screen.getByTestId('admin-confirm-dialog');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'admin-confirm-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'admin-confirm-description');
  });

  it('locks body overflow while open and restores it on unmount', () => {
    const originalOverflow = document.body.style.overflow;
    const { unmount } = render(<AdminConfirmDialog {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it('renders both Cancel and confirm buttons', () => {
    render(<AdminConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: defaultProps.confirmLabel })).toBeInTheDocument();
  });
});
