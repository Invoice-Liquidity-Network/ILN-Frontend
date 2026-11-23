import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InvoiceStatusBadge, { reconcileInvoiceStatus } from '../InvoiceStatusBadge';

describe('InvoiceStatusBadge', () => {
  it('renders the initial status', () => {
    render(<InvoiceStatusBadge status="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('applies correct classes for different statuses', () => {
    const { rerender } = render(<InvoiceStatusBadge status="Pending" />);
    expect(screen.getByText('Pending')).toHaveClass('bg-slate-100');

    rerender(<InvoiceStatusBadge status="Funded" />);
    expect(screen.getByText('Funded')).toHaveClass('bg-blue-100');

    rerender(<InvoiceStatusBadge status="Cancelled" />);
    expect(screen.getByText('Cancelled')).toHaveClass('bg-yellow-100');
    expect(screen.getByText('Cancelled')).toHaveClass('text-yellow-800');
  });

  it('reconciles status from heterogeneous indexer/RPC representations', () => {
    expect(reconcileInvoiceStatus('pending')).toBe('Pending');
    expect(reconcileInvoiceStatus('open')).toBe('Pending');
    expect(reconcileInvoiceStatus('funded')).toBe('Funded');
    expect(reconcileInvoiceStatus('active')).toBe('Funded');
    expect(reconcileInvoiceStatus('partially_funded')).toBe('PartiallyFunded');
    expect(reconcileInvoiceStatus('settled')).toBe('Paid');
    expect(reconcileInvoiceStatus('overdue')).toBe('Defaulted');
    expect(reconcileInvoiceStatus('in_dispute')).toBe('Disputed');
  });

  it('renders reconciled status for variant casing from indexer', () => {
    render(<InvoiceStatusBadge status="partially_funded" />);
    expect(screen.getByText('PartiallyFunded')).toBeInTheDocument();
  });
});
