import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import InvoiceDetailPage from '../app/i/[id]/page';
import { getInvoice, Invoice } from '@/utils/soroban';

vi.mock('@/utils/soroban', () => ({
  getInvoice: vi.fn(),
  payInvoice: vi.fn(),
  fundInvoice: vi.fn(),
}));

vi.mock('@/components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('@/context/WalletContext', () => ({
  useWallet: () => ({
    address: 'GUSER123',
    connect: vi.fn(),
  }),
}));

vi.mock('@/hooks/useApprovedTokens', () => ({
  useApprovedTokens: () => ({
    tokenMap: new Map(),
    defaultToken: { contractId: 'CUSDC', symbol: 'USDC', decimals: 7 },
  }),
}));

describe('InvoiceDetailPage route consistency', () => {
  const mockInvoice: Invoice = {
    id: 42n,
    freelancer: 'GFREELANCER',
    payer: 'GPAYER',
    amount: 10000000n,
    discount_rate: 500,
    due_date: 1800000000n,
    status: 'Pending',
    token: 'CUSDC',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invoice details for canonical numeric ID', async () => {
    vi.mocked(getInvoice).mockResolvedValueOnce(mockInvoice);

    render(<InvoiceDetailPage params={Promise.resolve({ id: '42' })} />);

    await waitFor(() => {
      expect(screen.getByText('Invoice #42')).toBeInTheDocument();
    });
  });

  it('handles malformed / non-numeric route ID without throwing', async () => {
    render(<InvoiceDetailPage params={Promise.resolve({ id: 'not-a-number' })} />);

    await waitFor(() => {
      expect(screen.getByText('Invoice Not Found')).toBeInTheDocument();
      expect(screen.getByText('Invalid invoice ID.')).toBeInTheDocument();
    });
  });

  it('handles missing invoice ID gracefully', async () => {
    vi.mocked(getInvoice).mockResolvedValueOnce(null as any);

    render(<InvoiceDetailPage params={Promise.resolve({ id: '999999' })} />);

    await waitFor(() => {
      expect(screen.getByText('Invoice Not Found')).toBeInTheDocument();
      expect(screen.getByText('The requested invoice does not exist.')).toBeInTheDocument();
    });
  });

  it('handles network / RPC error gracefully', async () => {
    vi.mocked(getInvoice).mockRejectedValueOnce(new Error('Network error'));

    render(<InvoiceDetailPage params={Promise.resolve({ id: '42' })} />);

    await waitFor(() => {
      expect(screen.getByText('Invoice Not Found')).toBeInTheDocument();
      expect(screen.getByText('Failed to load invoice details.')).toBeInTheDocument();
    });
  });
});
