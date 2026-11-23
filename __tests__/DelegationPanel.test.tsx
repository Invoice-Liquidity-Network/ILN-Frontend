import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DelegationPanel } from '@/components/governance/DelegationPanel';
import { useWallet } from '@/context/WalletContext';
import { useTransaction } from '@/hooks/useTransaction';
import { resolveFederatedAddress } from '@/utils/federation';

// Mock hooks and utils
vi.mock('@/context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

vi.mock('@/hooks/useTransaction', () => ({
  useTransaction: vi.fn(),
}));

vi.mock('@/utils/federation', () => ({
  resolveFederatedAddress: vi.fn(),
}));

const USER_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const RESOLVED_DELEGATE = 'GBQD2MXHXD2SRHRQZRZ5JZ4UNLMTMLZNNDJHCQXIJXE2ANBV5IDWB2XK';
const CYCLIC_DELEGATE = 'GBBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEFZSP';
const VALID_DELEGATE = 'GCI7N3HBCWNDW4XN22T7AILNGBOG2T3L6TFFC6EELZTYA3V2MOHK4GZ4';

let mockDelegationState: {
  delegatedTo: string | null;
  delegatedAmount: number;
  incomingDelegations: number;
} = {
  delegatedTo: null,
  delegatedAmount: 0,
  incomingDelegations: 450,
};

vi.mock('@/utils/governance', () => ({
  DELEGATE_VOTING_POWER_SUPPORTED: false,
  isValidStellarAddress: vi.fn((addr: string) => addr.startsWith('G') && addr.length === 56),
  getVotingPower: vi.fn().mockResolvedValue(1700),
  getDelegationInfo: vi.fn(async (addr: string) => {
    if (addr === CYCLIC_DELEGATE) {
      return { delegatedTo: USER_ADDRESS, delegatedAmount: 100, incomingDelegations: 0 };
    }
    return mockDelegationState;
  }),
  delegateVotingPower: vi.fn(async (delegateAddr: string | null) => {
    mockDelegationState = {
      delegatedTo: delegateAddr,
      delegatedAmount: delegateAddr ? 1250 : 0,
      incomingDelegations: 450,
    };
    return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  }),
}));

describe('DelegationPanel', () => {
  const mockExecute = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDelegationState = {
      delegatedTo: null,
      delegatedAmount: 0,
      incomingDelegations: 450,
    };
    (useWallet as any).mockReturnValue({
      address: USER_ADDRESS,
      isConnected: true,
      signTx: vi.fn(),
    });
    mockExecute.mockImplementation(async (action) => {
      if (typeof action === 'function') {
        await action();
      }
      return true;
    });
    (useTransaction as any).mockReturnValue({
      execute: mockExecute,
      loading: false,
      error: null,
    });
    (resolveFederatedAddress as any).mockResolvedValue(RESOLVED_DELEGATE);
  });

  it('renders on-chain weight and balance after loading (no mock seed)', async () => {
    render(<DelegationPanel />);
    // Initial render must not show fabricated seeded numbers.
    expect(screen.queryByText('1700 ILN')).toBeNull();
    expect(screen.queryByText('1250 ILN')).toBeNull();

    await waitFor(() => {
      expect(screen.getByText('1700 ILN')).toBeDefined(); // 1250 own + 450 incoming
    });
    expect(screen.getByText('1250 ILN')).toBeDefined();
    expect(screen.getByText('+450 ILN')).toBeDefined();
    expect(screen.getByText('Self-voting')).toBeDefined();
  });

  it('resolves federation addresses', async () => {
    render(<DelegationPanel />);
    const input = screen.getByPlaceholderText(/Stellar address/);

    fireEvent.change(input, { target: { value: 'alice*stellar.org' } });

    await waitFor(() => {
      expect(resolveFederatedAddress).toHaveBeenCalledWith('alice*stellar.org');
      expect(
        screen.getByText(
          new RegExp(`Ready to delegate to ${RESOLVED_DELEGATE.slice(0, 12)}`)
        )
      ).toBeDefined();
    });
  });

  it('detects delegation cycles', async () => {
    render(<DelegationPanel />);
    const input = screen.getByPlaceholderText(/Stellar address/);

    // Address that is mocked as a delegator to the user
    fireEvent.change(input, { target: { value: CYCLIC_DELEGATE } });

    await waitFor(() => {
      expect(
        screen.getByText(/You cannot delegate to an address that delegates back to you/)
      ).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /Delegate/ })).toBeDisabled();
  });

  it('handles delegation flow', async () => {
    mockExecute.mockResolvedValue(true);
    render(<DelegationPanel />);

    const input = screen.getByPlaceholderText(/Stellar address/);
    fireEvent.change(input, {
      target: { value: VALID_DELEGATE },
    });

    const button = screen.getByRole('button', { name: /Delegate/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalled();
      expect(screen.getByText(new RegExp(`Delegating to ${VALID_DELEGATE.slice(0, 6)}`))).toBeDefined();
      expect(screen.getByText(/Undelegate/)).toBeDefined();
    });
  });

  it('handles undelegation flow', async () => {
    mockExecute.mockResolvedValue(true);
    render(<DelegationPanel />);

    // First delegate
    const input = screen.getByPlaceholderText(/Stellar address/);
    fireEvent.change(input, {
      target: { value: VALID_DELEGATE },
    });
    fireEvent.click(screen.getByRole('button', { name: /Delegate/ }));

    await waitFor(() => {
      expect(screen.getByText(/Undelegate/)).toBeDefined();
    });

    // Now undelegate
    fireEvent.click(screen.getByText(/Undelegate/));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Self-voting')).toBeDefined();
    });
  });
});
