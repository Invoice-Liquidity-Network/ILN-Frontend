import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminHealthDashboard from '@/app/admin/page';

const adminAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const walletState = {
  address: adminAddress as string | null,
  signTx: vi.fn(),
};

const mockHealth = {
  paused: false,
  disputedInvoices: [
    {
      id: 1n,
      status: 'Disputed',
      freelancer: 'GFREELANCER',
      payer: 'GPAYER',
      amount: 100n,
      due_date: 1n,
      discount_rate: 100,
    },
  ],
  pendingProposals: [
    {
      id: 7,
      title: 'Update parameter',
      description: 'Update a protocol parameter.',
      type: 'ParameterUpdate',
      status: 'Active',
      proposer: 'GPROPOSER',
      createdAt: 1,
      votingStartsAt: 1,
      votingEndsAt: 2,
      votesFor: 0,
      votesAgainst: 0,
      quorumRequired: 10,
    },
  ],
  readyProposals: [
    {
      id: 3,
      title: 'Ready proposal',
      description: 'Ready to execute.',
      type: 'ProtocolUpgrade',
      status: 'Passed',
      proposer: 'GPROPOSER',
      createdAt: 1,
      votingStartsAt: 1,
      votingEndsAt: 2,
      executableAfter: 3,
      votesFor: 10,
      votesAgainst: 0,
      quorumRequired: 10,
    },
  ],
  oracleLastUpdatedAt: Math.floor(Date.now() / 1000) - 600,
  contractVersion: 'testnet:CD3TE3IA',
  upgradeWindowStartsAt: Math.floor(Date.now() / 1000) + 3 * 86_400,
  treasuryBalanceXlm: 123.45,
};

const mockAdminActions = [
  {
    id: 'sr-1',
    category: 'signer_rotation' as const,
    title: 'Multisig Signer Rotation',
    description: 'Multisig signer authority rotated from GCOEF7...567JKL to GAAAAA...AAAAWHF',
    actor: adminAddress,
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    txHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    isSecuritySensitive: true,
    metadata: {
      oldSigner: 'GCOEF7LMN456OPQ789RST012UVW345XYZ678ABC901DEF234GHI567JKL',
      newSigner: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      reason: 'Quarterly multisig key rotation',
      action: 'rotated',
    },
  },
  {
    id: 'pu-1',
    category: 'parameter_update' as const,
    title: 'Parameter Updated: Protocol fee rate',
    description: "Routine parameter 'fee_rate_bps' updated to 30 (0.3%)",
    actor: adminAddress,
    timestamp: Math.floor(Date.now() / 1000) - 7200,
    isSecuritySensitive: false,
    metadata: {
      parameter: 'fee_rate_bps',
      newValue: '30 (0.3%)',
      proposalId: 7,
    },
  },
];

const fetchProtocolHealth = vi.fn();
const fetchAdminActionHistory = vi.fn();
const setProtocolPaused = vi.fn();
const executeReadyProposals = vi.fn();

vi.mock('@/context/WalletContext', () => ({
  useWallet: () => walletState,
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/components/Navbar', () => ({
  default: () => <nav data-testid="navbar" />,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock('@/utils/admin-health', () => ({
  fetchProtocolHealth: () => fetchProtocolHealth(),
  fetchAdminActionHistory: () => fetchAdminActionHistory(),
  setProtocolPaused: (...args: unknown[]) => setProtocolPaused(...args),
  executeReadyProposals: (...args: unknown[]) => executeReadyProposals(...args),
  isAdminAddress: (address: string | null | undefined) => address === adminAddress,
}));

describe('AdminHealthDashboard', () => {
  beforeEach(() => {
    walletState.address = adminAddress;
    walletState.signTx.mockReset();
    fetchProtocolHealth.mockReset();
    fetchProtocolHealth.mockResolvedValue(mockHealth);
    fetchAdminActionHistory.mockReset();
    fetchAdminActionHistory.mockResolvedValue(mockAdminActions);
    setProtocolPaused.mockReset();
    setProtocolPaused.mockResolvedValue({ txHash: 'abc', paused: true });
    executeReadyProposals.mockReset();
    executeReadyProposals.mockResolvedValue(['tx']);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders a 403 state for non-admin wallets', () => {
    walletState.address = 'GNOTADMIN';
    render(<AdminHealthDashboard />);
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText(/Admin access required/i)).toBeInTheDocument();
    expect(fetchProtocolHealth).not.toHaveBeenCalled();
  });

  it('renders protocol health panels for the admin wallet', async () => {
    render(<AdminHealthDashboard />);
    expect(await screen.findByText('Protocol Health')).toBeInTheDocument();
    expect(screen.getByText('Protocol Status')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Open Disputes')).toBeInTheDocument();
    expect(screen.getByText('Pending Governance Proposals')).toBeInTheDocument();
    expect(screen.getByText('Oracle Last Updated')).toBeInTheDocument();
    expect(screen.getByText('Contract Version')).toBeInTheDocument();
    expect(screen.getByText('Treasury Balance')).toBeInTheDocument();
  });

  it('renders admin action audit log with distinct SignerRotated event security labeling', async () => {
    render(<AdminHealthDashboard />);

    expect(await screen.findByText('Admin Action Audit Log')).toBeInTheDocument();
    expect(await screen.findByText('Multisig Signer Rotation')).toBeInTheDocument();
    expect(screen.getByText('Security Critical')).toBeInTheDocument();
    expect(screen.getByText('Parameter Updated: Protocol fee rate')).toBeInTheDocument();
    expect(screen.getByText('Routine Parameter')).toBeInTheDocument();
    expect(screen.getByText(/Quarterly multisig key rotation/i)).toBeInTheDocument();
    expect(screen.getByText(/Previous Signer:/i)).toBeInTheDocument();
    expect(screen.getByText(/New Signer:/i)).toBeInTheDocument();
  });

  it('filters admin action audit log by category tabs', async () => {
    const user = userEvent.setup();
    render(<AdminHealthDashboard />);

    expect(await screen.findByText('Admin Action Audit Log')).toBeInTheDocument();
    expect(await screen.findByText('Multisig Signer Rotation')).toBeInTheDocument();
    expect(screen.getByText('Parameter Updated: Protocol fee rate')).toBeInTheDocument();

    // Filter to Signer Rotations only
    await user.click(screen.getByRole('button', { name: 'Signer Rotations (Security)' }));
    expect(screen.getByText('Multisig Signer Rotation')).toBeInTheDocument();
    expect(screen.queryByText('Parameter Updated: Protocol fee rate')).not.toBeInTheDocument();

    // Filter to Parameter Updates only
    await user.click(screen.getByRole('button', { name: 'Parameter Updates' }));
    expect(screen.queryByText('Multisig Signer Rotation')).not.toBeInTheDocument();
    expect(screen.getByText('Parameter Updated: Protocol fee rate')).toBeInTheDocument();
  });

  it('requires confirmation before pausing the protocol', async () => {
    const user = userEvent.setup();
    render(<AdminHealthDashboard />);
    await user.click(await screen.findByRole('button', { name: 'Pause' }));
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(setProtocolPaused).toHaveBeenCalledWith(true, adminAddress, walletState.signTx);
    });
  });

  it('does not call admin actions when confirmation is rejected', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = userEvent.setup();
    render(<AdminHealthDashboard />);
    await user.click(await screen.findByRole('button', { name: 'Pause' }));
    expect(setProtocolPaused).not.toHaveBeenCalled();
  });
});
