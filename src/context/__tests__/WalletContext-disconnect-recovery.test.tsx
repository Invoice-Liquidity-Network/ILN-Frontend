import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAddress,
  getNetwork,
  isConnected,
  setAllowed,
  signTransaction,
} from '@stellar/freighter-api';
import { WalletProvider, useWallet } from '../WalletContext';
import {
  addPendingTransaction,
  getPendingTransactions,
} from '@/lib/pending-transactions';

const ADDRESS = 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6';

const addToastMock = vi.fn();

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  setAllowed: vi.fn(),
  signTransaction: vi.fn(),
  getNetwork: vi.fn(),
  requestAccess: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../ToastContext', () => ({
  useToast: () => ({
    addToast: addToastMock,
    updateToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

vi.mock('@/utils/soroban', () => ({
  getWalletRoles: vi.fn().mockResolvedValue([]),
  getSorobanTransactionStatus: vi.fn().mockResolvedValue('not_found'),
}));

vi.mock('@/components/WalletSelectionModal', () => ({
  __esModule: true,
  default: ({ onSelectFreighter }: { onSelectFreighter: () => void }) => (
    <button onClick={onSelectFreighter}>select-freighter</button>
  ),
}));

function TestConsumer() {
  const wallet = useWallet();
  const [signResult, setSignResult] = useState('none');
  return (
    <div>
      <div data-testid="address">{wallet.address ?? 'disconnected'}</div>
      <div data-testid="signResult">{signResult}</div>
      <button onClick={() => void wallet.connect()}>connect</button>
      <button onClick={() => wallet.disconnect()}>disconnect</button>
      <button
        onClick={async () => {
          try {
            setSignResult(await wallet.signTx('xdr'));
          } catch (error) {
            setSignResult(`ERROR:${(error as Error).message}`);
          }
        }}
      >
        signTx
      </button>
    </div>
  );
}

async function connectFreighter() {
  fireEvent.click(screen.getByRole('button', { name: 'connect' }));
  fireEvent.click(await screen.findByRole('button', { name: 'select-freighter' }));
  await waitFor(() => expect(screen.getByTestId('address').textContent).toBe(ADDRESS));
}

const mockedIsConnected = vi.mocked(isConnected);
const mockedGetAddress = vi.mocked(getAddress);
const mockedSetAllowed = vi.mocked(setAllowed);
const mockedSignTransaction = vi.mocked(signTransaction);
const mockedGetNetwork = vi.mocked(getNetwork);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockedIsConnected.mockResolvedValue({ isConnected: true });
  mockedGetAddress.mockResolvedValue({ address: ADDRESS });
  mockedSetAllowed.mockResolvedValue({ isAllowed: true });
  mockedGetNetwork.mockResolvedValue({ network: 'TESTNET' });
  mockedSignTransaction.mockResolvedValue({ signedTxXdr: 'SIGNED_XDR' });
});

describe('WalletContext disconnect mid-submission recovery (#1292)', () => {
  it('preserves pending unknown-outcome transactions on disconnect and warns against re-submission', async () => {
    addPendingTransaction({
      hash: 'tx-unknown-1',
      operationKey: 'fund_invoice:42',
      address: ADDRESS,
      status: 'confirming',
    });

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>
    );
    await connectFreighter();

    fireEvent.click(screen.getByRole('button', { name: 'disconnect' }));

    expect(screen.getByTestId('address').textContent).toBe('disconnected');
    expect(getPendingTransactions()).toHaveLength(1);
    expect(getPendingTransactions()[0].hash).toBe('tx-unknown-1');
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: 'Disconnected with pending transaction',
      })
    );
  });

  it('shows standard Disconnected toast when no pending transactions exist', async () => {
    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>
    );
    await connectFreighter();

    fireEvent.click(screen.getByRole('button', { name: 'disconnect' }));

    expect(addToastMock).toHaveBeenCalledWith({ type: 'success', title: 'Disconnected' });
  });

  it('aborts in-flight signTx if wallet disconnects before signing completes', async () => {
    let resolveSign!: (value: { signedTxXdr: string }) => void;
    mockedSignTransaction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSign = resolve;
        })
    );

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>
    );
    await connectFreighter();

    fireEvent.click(screen.getByRole('button', { name: 'signTx' }));
    await waitFor(() => expect(mockedSignTransaction).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'disconnect' }));
    await act(async () => {
      resolveSign({ signedTxXdr: 'SIGNED_XDR' });
    });

    await waitFor(() =>
      expect(screen.getByTestId('signResult').textContent).toContain('ERROR:')
    );
  });
});
