import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTransactionPreview } from '../useTransactionPreview';
import type { ExpectedTransactionAction } from '@/utils/transactionPattern';

vi.mock('@/utils/decodeTransaction', () => ({
  decodeTransactionXdr: vi.fn((xdr: string) =>
    xdr === 'INVALID_XDR'
      ? null
      : {
          sourceAccount: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
          fee: '100',
          networkPassphrase: null,
          transactionType: 'unknown' as const,
          operations: [
            {
              contract: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4',
              functionName: 'fund_invoice',
              args: [
                { name: 'arg0', type: 'address', value: 'GAAAA...' },
                { name: 'arg1', type: 'u64', value: '42' },
                { name: 'arg2', type: 'i128', value: '1000000' },
              ],
              rawArgs: [],
            },
          ],
        }
  ),
}));

function PreviewHarness({
  onResult,
}: {
  onResult: (result: { ok?: boolean; error?: string }) => void;
}) {
  const { previewModal, requestPreview } = useTransactionPreview();

  const trigger = (xdr: string, expectedAction?: ExpectedTransactionAction) => {
    void requestPreview(xdr, expectedAction)
      .then((ok) => onResult({ ok }))
      .catch((err: Error) => onResult({ error: err.message }));
  };

  return (
    <div>
      <button type="button" onClick={() => trigger('VALID_XDR', 'fund_invoice')}>
        Open Preview
      </button>
      <button type="button" onClick={() => trigger('   ')}>
        Open Empty
      </button>
      <button type="button" onClick={() => trigger('INVALID_XDR', 'fund_invoice')}>
        Open Undecodable
      </button>
      {previewModal}
    </div>
  );
}

describe('useTransactionPreview (#1290)', () => {
  it('resolves true when the user confirms the preview modal', async () => {
    const onResult = vi.fn();
    render(<PreviewHarness onResult={onResult} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Preview' }));
    expect(screen.getByText('Transaction Preview')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign transaction/i }));
    });

    expect(onResult).toHaveBeenCalledWith({ ok: true });
    expect(screen.queryByText('Transaction Preview')).not.toBeInTheDocument();
  });

  it('rejects when the user cancels the preview modal', async () => {
    const onResult = vi.fn();
    render(<PreviewHarness onResult={onResult} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Preview' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(onResult).toHaveBeenCalledWith({ error: 'Transaction cancelled by user' });
  });

  it('rejects empty/whitespace XDR before opening the modal', async () => {
    const onResult = vi.fn();
    render(<PreviewHarness onResult={onResult} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open Empty' }));
    });

    expect(onResult).toHaveBeenCalledWith({
      error: 'Transaction payload (XDR) is required for preview.',
    });
    expect(screen.queryByText('Transaction Preview')).not.toBeInTheDocument();
  });

  it('rejects concurrent requestPreview calls without replacing the active preview', async () => {
    const onResult = vi.fn();
    render(<PreviewHarness onResult={onResult} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Preview' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open Undecodable' }));
    });

    expect(onResult).toHaveBeenCalledWith({
      error: 'A transaction preview is already awaiting confirmation.',
    });
    // Original preview remains open
    expect(screen.getByText('fund_invoice')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign transaction/i }));
    });
    expect(onResult).toHaveBeenCalledWith({ ok: true });
  });

  it('rejects pending preview promise if unmounted mid-preview', async () => {
    const onResult = vi.fn();
    const { unmount } = render(<PreviewHarness onResult={onResult} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Preview' }));
    await act(async () => {
      unmount();
    });

    expect(onResult).toHaveBeenCalledWith({ error: 'Transaction preview interrupted' });
  });
});
