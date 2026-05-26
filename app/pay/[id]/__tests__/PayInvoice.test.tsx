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
  cancelInvoice: vi.fn(),
  submitSignedTransaction: vi.fn(),
}));

describe('PayInvoicePage', () => {
  type ResolvedParamsPromise = Promise<{ id: string }> & { _resolvedValue: { id: string } };

  const makeParams = (id: string): ResolvedParamsPromise =>
    Object.assign(Promise.resolve({ id }), { _resolvedValue: { id } });

  const mockInvoice = {
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
    vi.mocked(useToast).mockReturnValue(mockToast);
    vi.mocked(soroban.getInvoice).mockResolvedValue(mockInvoice);
  });

  it('should render invoice summary without wallet connection', async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: null,
      connect: vi.fn(),
    } as ReturnType<typeof useWallet>);

    const params = makeParams('1');
    render(<PayInvoicePage params={params} />);

    await waitFor(() => {
      expect(screen.getByText(/100\s+USDC/)).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet and Pay')).toBeInTheDocument();
    });
  });

  it('should show warning if connected wallet is not the payer', async () => {
    vi.mocked(useWallet).mockReturnValue({
      address: 'GWRONGWALLET',
      connect: vi.fn(),
    } as ReturnType<typeof useWallet>);

    const params = makeParams('1');
    render(<PayInvoicePage params={params} />);

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

    const params = makeParams('1');
    render(<PayInvoicePage params={params} />);

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

    vi.mocked(soroban.markPaid).mockResolvedValue('mock-tx' as Awaited<ReturnType<typeof soroban.markPaid>>);
    vi.mocked(soroban.submitSignedTransaction).mockResolvedValue({ txHash: 'hash123' });

    const params = makeParams('1');
    render(<PayInvoicePage params={params} />);

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

  it('should let the submitter cancel a pending invoice optimistically', async () => {
    vi.mocked(soroban.getInvoice).mockResolvedValue({
      ...mockInvoice,
      status: 'Pending',
    });
    const mockSignTx = vi.fn();
    vi.mocked(useWallet).mockReturnValue({
      address: 'GFREELANCER',
      signTx: mockSignTx,
    } as ReturnType<typeof useWallet>);

    vi.mocked(soroban.cancelInvoice).mockResolvedValue({ tx: 'cancel-tx' });
    vi.mocked(soroban.submitSignedTransaction).mockResolvedValue({ txHash: 'cancel-hash' });

    const params = makeParams('1');
    render(<PayInvoicePage params={params} />);

    await screen.findByText('Cancel Invoice');
    fireEvent.click(screen.getByText('Cancel Invoice'));
    fireEvent.click(screen.getByText('Confirm Cancel'));

    await waitFor(() => {
      expect(soroban.cancelInvoice).toHaveBeenCalledWith('GFREELANCER', 1n);
      expect(soroban.submitSignedTransaction).toHaveBeenCalledWith({ tx: 'cancel-tx', signTx: mockSignTx });
      expect(screen.getByText('Invoice Cancelled')).toBeInTheDocument();
    });
  });
});
