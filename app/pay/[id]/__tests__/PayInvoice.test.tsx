import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PayInvoicePage from '../page';
import * as soroban from '@/utils/soroban';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import type { Invoice } from '@/utils/soroban';

// Mock context and utils
vi.mock('@/context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/utils/soroban', () => ({
  getInvoice: vi.fn(),
  markPaid: vi.fn(),
  submitSignedTransaction: vi.fn(),
}));

vi.mock('@/components/InvoicePdfDownloadButton', () => ({
  default: () => <button>Download PDF</button>,
}));

type ParamsPromise = Promise<{ id: string }> & { _resolvedValue?: { id: string } };

function createParams(): ParamsPromise {
  const params = Promise.resolve({ id: '1' }) as ParamsPromise;
  params._resolvedValue = { id: '1' };
  return params;
}

describe('PayInvoicePage', () => {
  const mockInvoice: Invoice = {
    id: 1n,
    freelancer: 'GFREELANCER',
    payer: 'GPAYER',
    amount: 1000000000n,
    due_date: 1713960000n,
    status: 'Funded',
    discount_rate: 300,
  };

  const mockToast = {
    addToast: vi.fn().mockReturnValue('toast-id'),
    updateToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue(mockToast);
    vi.mocked(soroban.getInvoice).mockResolvedValue(mockInvoice);
  });

  it('should render invoice summary without wallet connection', async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: null,
      connect: vi.fn(),
    } as ReturnType<typeof useWallet>);

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText(/100\s+USDC/)).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet and Pay')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    });
  });

  it('should show warning if connected wallet is not the payer', async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: 'GWRONGWALLET',
      connect: vi.fn(),
    } as ReturnType<typeof useWallet>);

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText('Address Mismatch')).toBeInTheDocument();
      expect(screen.getByText('Restricted to Registered Payer')).toBeInTheDocument();
    });
  });

  it('should show confirmation if invoice is already paid', async () => {
    vi.mocked(soroban.getInvoice).mockResolvedValue({
      ...mockInvoice,
      status: 'Paid',
    });

    vi.mocked(useWallet).mockReturnValue({
      address: 'GPAYER',
    } as ReturnType<typeof useWallet>);

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText('Invoice settled')).toBeInTheDocument();
      expect(screen.getByText('Settlement Complete')).toBeInTheDocument();
    });
  });

  it('should call markPaid when Settle button is clicked', async () => {
    const mockSignTx = vi.fn();
    vi.mocked(useWallet).mockReturnValue({
      address: 'GPAYER',
      signTx: mockSignTx,
    } as ReturnType<typeof useWallet>);

    vi.mocked(soroban.markPaid).mockResolvedValue('mock-tx');
    vi.mocked(soroban.submitSignedTransaction).mockResolvedValue({ txHash: 'hash123' });

    render(<PayInvoicePage params={createParams()} />);

    await waitFor(() => {
      expect(screen.getByText('Settle Invoice Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Settle Invoice Now'));

    await waitFor(() => {
      expect(soroban.markPaid).toHaveBeenCalledWith('GPAYER', 1n);
      expect(soroban.submitSignedTransaction).toHaveBeenCalled();
      expect(mockToast.updateToast).toHaveBeenCalledWith('toast-id', expect.objectContaining({ type: 'success' }));
    });
  });
});
