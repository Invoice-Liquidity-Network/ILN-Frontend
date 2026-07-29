import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Invoice } from '@/utils/soroban';
import type { ContractStats } from '@/utils/contract-stats';
import { ERROR_BOUNDARY_MESSAGE, createThrowingComponent } from '@/test-utils/contract-failure';

const WALLET_ADDRESS = 'GWALLET1234567890ABCDEFGHIJKLMNOP';

const throwGates = vi.hoisted(() => ({
  invoiceBadge: { shouldThrow: true },
  marketplaceCard: { shouldThrow: true },
  lpPortfolio: { shouldThrow: true },
  quorumBar: { shouldThrow: true },
  statsCards: { shouldThrow: true },
}));

const mockRefetch = vi.hoisted(() => vi.fn());
const mockLoadProposals = vi.hoisted(() => vi.fn());
const governanceLoadCount = vi.hoisted(() => ({ value: 0 }));

const sampleInvoice: Invoice = {
  id: 1n,
  freelancer: WALLET_ADDRESS,
  payer: 'GPAYER1234567890ABCDEFGHIJKLMNO',
  amount: 10_000_000n,
  discount_rate: 500,
  due_date: BigInt(Math.floor(Date.now() / 1000) + 86_400 * 14),
  status: 'Pending',
  token: '',
};

const mockStats: ContractStats = {
  total_invoices: 10,
  total_funded: 8,
  total_paid: 6,
  total_volume_usd: 50_000,
  volume_by_token: [],
  daily_volume: [],
  dispute_rate: {
    rate30dPercent: 0,
    funded30d: 0,
    disputed30d: 0,
    dailyTrend90d: [],
  },
};

function resetThrowGates() {
  throwGates.invoiceBadge.shouldThrow = true;
  throwGates.marketplaceCard.shouldThrow = true;
  throwGates.lpPortfolio.shouldThrow = true;
  throwGates.quorumBar.shouldThrow = true;
  throwGates.statsCards.shouldThrow = true;
}

vi.mock('@/context/WalletContext', () => ({
  useWallet: () => ({
    address: WALLET_ADDRESS,
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signTx: null,
    isInstalled: true,
    error: null,
    networkMismatch: false,
  }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn(), updateToast: vi.fn() }),
}));

vi.mock('@/components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navigation</nav>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('@/components/PageHeader', () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@/components/BulkActionBar', () => ({ default: () => null }));
vi.mock('@/components/LastUpdated', () => ({ default: () => null }));
vi.mock('@/components/CancelInvoiceButton', () => ({ default: () => null }));
vi.mock('@/components/InvoiceQRModal', () => ({ default: () => null }));
vi.mock('@/components/InvoiceTimeline', () => ({ default: () => null }));
vi.mock('@/hooks/useDocumentTitle', () => ({ useDocumentTitle: vi.fn() }));

vi.mock('@/components/InvoiceStatusBadge', () => ({
  default: createThrowingComponent(
    throwGates.invoiceBadge,
    <span data-testid="invoice-status-recovered">Invoice status loaded</span>
  ),
}));

vi.mock('@/components/InvoiceMarketplaceCard', () => ({
  default: createThrowingComponent(throwGates.marketplaceCard, <div>Marketplace invoice card</div>),
}));

vi.mock('@/components/LPPortfolio', () => ({
  default: createThrowingComponent(throwGates.lpPortfolio, <div>LP portfolio loaded</div>),
}));

vi.mock('@/components/QuorumProgressBar', () => ({
  default: createThrowingComponent(
    throwGates.quorumBar,
    <div data-testid="quorum-bar">Quorum</div>
  ),
}));

vi.mock('@/components/stats/StatsMetricCards', () => ({
  default: createThrowingComponent(throwGates.statsCards, <div>Stats metric cards</div>),
}));

vi.mock('@/components/stats/StatsDisputeRateCard', () => ({ default: () => null }));
vi.mock('@/components/stats/StatsVolumeChart', () => ({ default: () => null }));
vi.mock('@/components/stats/StatsTokenBreakdown', () => ({ default: () => null }));
vi.mock('@/components/stats/ProtocolYieldAnalyticsSection', () => ({ default: () => null }));

vi.mock('@/hooks/useInvoices', () => ({
  useInvoices: () => ({
    data: [sampleInvoice],
    isLoading: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: mockRefetch,
  }),
}));

vi.mock('@/hooks/useApprovedTokens', () => ({
  useApprovedTokens: () => ({ tokenMap: new Map(), defaultToken: null }),
}));

vi.mock('@/hooks/usePayerScores', () => ({
  usePayerScores: () => ({ scores: new Map(), risks: new Map() }),
}));

vi.mock('@/hooks/useLPSettings', () => ({
  useLPSettings: () => ({ settings: { minReputation: 0 } }),
}));

vi.mock('@/hooks/useContractStats', () => ({
  useContractStats: () => ({
    data: mockStats,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));

vi.mock('@/utils/governance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/governance')>();
  return {
    ...actual,
    fetchProposals: (...args: unknown[]) => mockLoadProposals(...args),
    getVotingPower: vi.fn(() => Promise.resolve(100)),
    timeRemaining: vi.fn(() => '2 days'),
    totalVotes: vi.fn(() => 1000),
  };
});

vi.mock('@/hooks/useTransaction', () => ({
  useTransaction: () => ({ execute: vi.fn(), loading: false, signingModal: null }),
}));
vi.mock('@/hooks/useWatchlist', () => ({
  useWatchlist: () => ({
    watchlist: [],
    add: vi.fn(),
    remove: vi.fn(),
    isInWatchlist: () => false,
  }),
}));
vi.mock('@/hooks/useInsurance', () => ({
  useInsurance: () => ({ isEnrolled: false }),
}));
vi.mock('@/components/FundConfirmModal', () => ({ default: () => null }));
vi.mock('@/components/DisputeInvoiceModal', () => ({ default: () => null }));
vi.mock('@/components/LPTransferModal', () => ({ default: () => null }));
vi.mock('@/components/LPOnboardingModal', () => ({ default: () => null }));
vi.mock('@/components/LPSettingsModal', () => ({ default: () => null }));
vi.mock('@/components/InsurancePoolPanel', () => ({ default: () => null }));
vi.mock('@/components/LPRiskSummaryPanel', () => ({ default: () => null }));
vi.mock('@/components/DynamicYieldAnalyticsChart', () => ({ default: () => null }));
vi.mock('@/components/LPYieldComparison', () => ({ default: () => null }));
vi.mock('@/components/YieldCalculator', () => ({ default: () => null }));
vi.mock('@/components/LPEarningsHistory', () => ({ default: () => null }));
vi.mock('@/components/ExportButton', () => ({ ExportButton: () => null }));
vi.mock('@/components/InvoiceFilterBar', () => ({ default: () => null }));
vi.mock('@/components/TokenSelector', () => ({ default: () => null }));
vi.mock('@/components/RiskBadge', () => ({ default: () => <span>Low</span> }));
vi.mock('@/components/SkeletonRow', () => ({ default: () => null, LP_DISCOVERY_COLUMNS: [] }));

vi.mock('@/components/VoteProgressBar', () => ({
  default: () => <div data-testid="vote-progress">Votes</div>,
}));

vi.mock('@/components/VotingPowerDisplay', () => ({
  default: () => <div data-testid="voting-power">Voting Power</div>,
}));

vi.mock('@/components/governance/TokenAllowlistPanel', () => ({
  default: () => <div data-testid="token-allowlist">Token Allowlist</div>,
}));

import DashboardPage from '@/screens/Dashboard';
import MarketplacePage from '@/app/marketplace/page';
import LPDashboard from '@/components/LPDashboard';
import GovernancePage from '@/app/governance/page';
import ProtocolStatsScreen from '@/screens/ProtocolStats';
import { MOCK_PROPOSALS } from '@/utils/governance';

describe('section error boundaries — contract failure recovery', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRefetch.mockImplementation(() => {
      throwGates.invoiceBadge.shouldThrow = false;
      throwGates.marketplaceCard.shouldThrow = false;
      throwGates.lpPortfolio.shouldThrow = false;
      throwGates.quorumBar.shouldThrow = false;
      throwGates.statsCards.shouldThrow = false;
    });
    mockLoadProposals.mockImplementation(async () => {
      governanceLoadCount.value += 1;
      if (governanceLoadCount.value > 1) {
        throwGates.quorumBar.shouldThrow = false;
      }
      return MOCK_PROPOSALS;
    });
    mockRefetch.mockClear();
    mockLoadProposals.mockClear();
    governanceLoadCount.value = 0;
    resetThrowGates();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invoice list: shows error boundary on contract render failure and recovers on retry', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(ERROR_BOUNDARY_MESSAGE)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByTestId('invoice-status-recovered')).toBeInTheDocument();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('marketplace: shows error boundary on contract render failure and recovers on retry', async () => {
    const user = userEvent.setup();
    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText(ERROR_BOUNDARY_MESSAGE)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Marketplace invoice card')).toBeInTheDocument();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('LP portfolio: shows error boundary on contract render failure and recovers on retry', async () => {
    const user = userEvent.setup();
    render(<LPDashboard />);

    await user.click(screen.getByRole('button', { name: /my funded/i }));

    await waitFor(() => {
      expect(screen.getByText(ERROR_BOUNDARY_MESSAGE)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('LP portfolio loaded')).toBeInTheDocument();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('governance proposals: shows error boundary on contract render failure and recovers on retry', async () => {
    const user = userEvent.setup();
    render(<GovernancePage />);

    await waitFor(() => {
      expect(screen.getByText(ERROR_BOUNDARY_MESSAGE)).toBeInTheDocument();
    });

    throwGates.quorumBar.shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getAllByTestId('quorum-bar').length).toBeGreaterThan(0);
    });
    expect(mockLoadProposals).toHaveBeenCalled();
  });

  it('protocol stats: shows error boundary on contract render failure and recovers on retry', async () => {
    const user = userEvent.setup();
    render(<ProtocolStatsScreen />);

    await waitFor(() => {
      expect(screen.getByText(ERROR_BOUNDARY_MESSAGE)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Stats metric cards')).toBeInTheDocument();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });
});
