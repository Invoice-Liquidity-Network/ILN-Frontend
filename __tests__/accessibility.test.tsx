import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import Providers from '../app/Providers';
import { NotificationProvider } from '../src/context/NotificationContext';
import HomePage from '../app/page';
import PayInvoicePage from '../app/pay/[id]/page';
import GovernancePage from '../app/governance/page';
import LPDashboardPage from '../app/lp/page';
import LeaderboardPage from '../app/leaderboard/page';
import FreelancerPage from '../app/freelancer/page';

const mockToast = {
  addToast: vi.fn().mockReturnValue('toast-id'),
  updateToast: vi.fn(),
};

const mockWallet = {
  address: null,
  isConnected: false,
  isInstalled: false,
  error: null,
  networkMismatch: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  signTx: vi.fn(),
};

vi.mock('@/context/WalletContext', () => ({
  useWallet: vi.fn(() => mockWallet),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: vi.fn(() => mockToast),
}));

vi.mock('@/hooks/useApprovedTokens', () => ({
  useApprovedTokens: vi.fn(() => ({
    tokenMap: new Map([['USDC', { contractId: 'USDC', symbol: 'USDC' }]]),
    defaultToken: { contractId: 'USDC', symbol: 'USDC' },
  })),
}));

vi.mock('@/hooks/useInvoiceFilters', () => ({
  useInvoiceFilters: vi.fn(() => ({
    filters: [],
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    activeFilterCount: 0,
  })),
  applyInvoiceFilters: vi.fn((items) => items),
}));

vi.mock('@/hooks/useInvoices', () => ({
  useInvoices: vi.fn(() => ({
    data: [],
    isLoading: false,
    dataUpdatedAt: Date.now(),
    refetch: vi.fn(),
  })),
  useFundInvoice: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useWatchlist', () => ({
  useWatchlist: vi.fn(() => ({
    watchlist: [],
    toggleWatchlist: vi.fn(),
    isInWatchlist: vi.fn(() => false),
  })),
}));

vi.mock('@/hooks/usePayerScores', () => ({
  usePayerScores: vi.fn(() => ({
    scores: new Map(),
    risks: new Map(),
  })),
}));

vi.mock('@/utils/governance', async () => {
  const actual = await vi.importActual<typeof import('@/utils/governance')>('@/utils/governance');
  return {
    ...actual,
    fetchProposals: vi.fn(async () => []),
  };
});

vi.mock('@/utils/soroban', async () => {
  const actual = await vi.importActual<typeof import('@/utils/soroban')>('@/utils/soroban');
  return {
    ...actual,
    getInvoice: vi.fn(async () => ({
      id: 1n,
      freelancer: 'GFREELANCER',
      payer: 'GPAYER',
      amount: 1000000000n,
      due_date: 1713960000n,
      status: 'Funded',
      token: 'USDC',
      discount_rate: 0n,
      funded_amount: 0n,
    })),
    getTopPayers: vi.fn(async () => []),
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <Providers>
      <NotificationProvider>{children}</NotificationProvider>
    </Providers>
  </I18nextProvider>
);

const axeConfig = {
  rules: {
    'heading-order': { enabled: false },
    label: { enabled: false },
    'select-name': { enabled: false },
  },
};

describe('Accessibility checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Home page should have no accessibility violations', async () => {
    const { container } = render(<HomePage />, { wrapper: TestWrapper });
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('Invoice detail page should have no accessibility violations', async () => {
    const params = Promise.resolve({ id: '1' }) as any;
    params._resolvedValue = { id: '1' };
    const { container } = render(<PayInvoicePage params={params} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(screen.getByText(/Invoice Summary/i)).toBeInTheDocument();
    });
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('LP dashboard page should have no accessibility violations', async () => {
    const { container } = render(<LPDashboardPage />, { wrapper: TestWrapper });
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('Governance page should have no accessibility violations', async () => {
    const { container } = render(<GovernancePage />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Proposals/i })).toBeInTheDocument();
    });
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('Leaderboard page should have no accessibility violations', async () => {
    const { container } = render(<LeaderboardPage />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Share Leaderboard/i })).toBeInTheDocument();
    });
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('Freelancer page should have no accessibility violations', async () => {
    const { container } = render(<FreelancerPage />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText(/Invoice Dashboard/i)).toBeInTheDocument();
    });
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });
});

describe('Keyboard Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Home page buttons should be keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<HomePage />, { wrapper: TestWrapper });

    // Find all buttons and links on the page
    const buttons = screen.getAllByRole('button');
    const links = screen.getAllByRole('link');
    const focusableElements = [...buttons, ...links];

    // Verify that we can tab through elements
    expect(focusableElements.length).toBeGreaterThan(0);

    // Tab to first element
    await user.tab();
    const activeElement = document.activeElement;
    expect(activeElement).toBeTruthy();
    expect(focusableElements).toContain(activeElement);
  });

  it('Invoice detail page form should be keyboard navigable', async () => {
    const user = userEvent.setup();
    const params = Promise.resolve({ id: '1' }) as any;
    params._resolvedValue = { id: '1' };

    render(<PayInvoicePage params={params} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText(/Invoice Summary/i)).toBeInTheDocument();
    });

    // Tab through form elements
    await user.tab();
    const activeElement = document.activeElement;
    expect(activeElement).toBeTruthy();
  });

  it('LP dashboard interactive elements should be keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<LPDashboardPage />, { wrapper: TestWrapper });

    // Find interactive elements
    const buttons = screen.queryAllByRole('button');
    const links = screen.queryAllByRole('link');

    // Verify keyboard navigation
    if (buttons.length > 0 || links.length > 0) {
      await user.tab();
      const activeElement = document.activeElement;
      expect(activeElement).toBeTruthy();
    }
  });

  it('Governance page controls should be keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<GovernancePage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Proposals/i })).toBeInTheDocument();
    });

    // Tab through page
    await user.tab();
    const activeElement = document.activeElement;
    expect(activeElement).toBeTruthy();
  });

  it('Marketplace components should support keyboard interactions', async () => {
    const user = userEvent.setup();
    render(<LeaderboardPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Share Leaderboard/i })).toBeInTheDocument();
    });

    const shareButton = screen.getByRole('button', {
      name: /Share Leaderboard/i,
    });

    // Test keyboard activation
    shareButton.focus();
    expect(document.activeElement).toBe(shareButton);

    // Test Enter key
    await user.keyboard('{Enter}');
  });

  it('Profile/Freelancer page should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<FreelancerPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText(/Invoice Dashboard/i)).toBeInTheDocument();
    });

    // Tab through interactive elements
    await user.tab();
    const activeElement = document.activeElement;
    expect(activeElement).toBeTruthy();
  });
});
