import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubmitInvoiceForm from '../SubmitInvoiceForm';

const VALID_STELLAR_PAYER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const VALID_STELLAR_FREELANCER = 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6';

const submitInvoiceTransaction = vi.fn();
const walletState = {
  address: VALID_STELLAR_FREELANCER as string | null,
  isConnected: true,
  isInstalled: true,
  error: null as string | null,
  networkMismatch: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  signTx: vi.fn(async () => 'signed-xdr'),
};

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn().mockResolvedValue(true),
  getAddress: vi.fn().mockResolvedValue({ address: VALID_STELLAR_FREELANCER }),
  setAllowed: vi.fn().mockResolvedValue(true),
  signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: 'signed-xdr' }),
  getNetwork: vi.fn().mockResolvedValue({ network: 'TESTNET' }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn(), updateToast: vi.fn(), removeToast: vi.fn() }),
}));

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => ({ ...walletState }),
}));

vi.mock('../../utils/soroban', () => ({
  submitInvoiceTransaction: (...args: unknown[]) => submitInvoiceTransaction(...args),
  submitSignedTransaction: vi.fn(),
  getNativeXlmBalance: vi.fn(async () => 0n),
  getTokenBalance: vi.fn(async () => 0n),
}));

vi.mock('../../hooks/useApprovedTokens', () => ({
  useApprovedTokens: () => ({
    tokens: [{ symbol: 'USDC', decimals: 7, contractId: 'TOKEN_ID', isAllowed: true }],
    tokenMap: new Map([
      ['TOKEN_ID', { symbol: 'USDC', decimals: 7, contractId: 'TOKEN_ID', isAllowed: true }],
      ['DISALLOWED_ID', { symbol: 'BAD', decimals: 7, contractId: 'DISALLOWED_ID', isAllowed: false }],
    ]),
    defaultToken: { symbol: 'USDC', decimals: 7, contractId: 'TOKEN_ID', isAllowed: true },
    isLoading: false,
    error: null,
  }),
}));

function futureDueDate(daysAhead = 30) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function fillValidStep1() {
  fireEvent.change(screen.getByPlaceholderText('G...'), {
    target: { value: VALID_STELLAR_PAYER },
  });
  fireEvent.change(screen.getByPlaceholderText('5000.00'), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: futureDueDate() } });
}

describe('SubmitInvoiceForm validation & integer units (#1298)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletState.address = VALID_STELLAR_FREELANCER;
    walletState.isConnected = true;
    walletState.networkMismatch = false;
  });

  it('rejects self-invoicing when payer matches the connected wallet address', () => {
    render(<SubmitInvoiceForm />);

    const payerInput = screen.getByPlaceholderText('G...');
    fireEvent.change(payerInput, { target: { value: VALID_STELLAR_FREELANCER } });
    fireEvent.blur(payerInput);

    expect(
      screen.getByText('Payer address cannot be the same as your connected wallet.')
    ).toBeInTheDocument();
  });

  it('blocks advancing when referral code contains invalid characters', () => {
    render(<SubmitInvoiceForm />);
    fillValidStep1();

    const refInput = screen.getByPlaceholderText('e.g. ILN-FRIEND');
    fireEvent.change(refInput, { target: { value: 'BAD REF!' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByText(
        'Referral code may only contain letters, numbers, hyphens, and underscores (max 64 characters).'
      )
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('3.00')).not.toBeInTheDocument();
  });

  it('rejects discount rates with more than 2 decimal places or non-numeric suffixes', () => {
    render(<SubmitInvoiceForm />);
    fillValidStep1();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    const discountInput = screen.getByPlaceholderText('3.00');
    fireEvent.change(discountInput, { target: { value: '3.125' } });
    fireEvent.blur(discountInput);

    expect(
      screen.getByText('Discount rate must have at most 2 decimal places (1% to 50%).')
    ).toBeInTheDocument();
  });

  it('does not fall back to defaultToken when initialValues.tokenId is unapproved', () => {
    render(<SubmitInvoiceForm initialValues={{ tokenId: 'DISALLOWED_ID' }} />);
    fillValidStep1();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByText('Selected token is not currently approved.')
    ).toBeInTheDocument();
    expect(submitInvoiceTransaction).not.toHaveBeenCalled();
  });
});
