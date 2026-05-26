import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PayInvoicePage from '../page';
import * as soroban from '@/utils/soroban';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';

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

type TestParams = Promise<{ id: string }> & { _resolvedValue: { id: string } };
type WalletMock = Partial<ReturnType<typeof useWallet>>;
type ToastMock = ReturnType<typeof useToast>;

function params(id = '1'): TestParams {
  const value = Promise.resolve({ id }) as TestParams;
  value._resolvedValue = { id };
  return value;
}

function mockWallet(value: WalletMock) {
  vi.mocked(useWallet).mockReturnValue(value as ReturnType<typeof useWallet>);
}

describe('PayInvoicePage', () => {
  const mockInvoice: soroban.Invoice = {
    id: 1n,
    freelancer: 'GFREELANCER',
    payer: 'GPAYER',
    amount: 1000000000n,
    due_date: 1713960000n,
    status: 'Funded',
  };

  const mockToast = {
    addToast: vi.fn().mockReturnValue('toast-id'),
    updateToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue(mockToast as ToastMock);
    vi.mocked(soroban.getInvoice).mockResolvedValue(mockInvoice);
  });

  it('should render invoice summary without wallet connection', async () => {
    mockWallet({
      address: null,
      connect: vi.fn(),
    });

    render(<PayInvoicePage params={params()} />);

    await waitFor(() => {
      expect(screen.getByText(/1,000\s+USDC/)).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet and Pay')).toBeInTheDocument();
    });
  });

  it('should show warning if connected wallet is not the payer', async () => {
    mockWallet({
      address: 'GWRONGWALLET',
      connect: vi.fn(),
    });

    render(<PayInvoicePage params={params()} />);

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

    mockWallet({
      address: 'GPAYER',
    });

    render(<PayInvoicePage params={params()} />);

    await waitFor(() => {
      expect(screen.getByText('Invoice settled')).toBeInTheDocument();
      expect(screen.getByText('Settlement Complete')).toBeInTheDocument();
    });
  });

  it('shows sharing controls to the invoice submitter', async () => {
    mockWallet({
      address: 'GFREELANCER',
      connect: vi.fn(),
    });

    render(<PayInvoicePage params={params()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /share invoice/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /share via email/i })).toBeInTheDocument();
    });
  });

  it('does not show sharing controls to non-submitters', async () => {
    mockWallet({
      address: 'GPAYER',
      connect: vi.fn(),
    });

    render(<PayInvoicePage params={params()} />);

    await waitFor(() => {
      expect(screen.getByText('Settle Invoice Now')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /share invoice/i })).not.toBeInTheDocument();
  });

  it('should call markPaid when Settle button is clicked', async () => {
    const mockSignTx = vi.fn();
    mockWallet({
      address: 'GPAYER',
      signTx: mockSignTx,
    });

    vi.mocked(soroban.markPaid).mockResolvedValue('mock-tx' as unknown as Awaited<ReturnType<typeof soroban.markPaid>>);
    vi.mocked(soroban.submitSignedTransaction).mockResolvedValue({ txHash: 'hash123' });

    render(<PayInvoicePage params={params()} />);

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
