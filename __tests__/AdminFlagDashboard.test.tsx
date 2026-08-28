import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminFlagDashboard from '@/app/admin/flags/page';

const ADMIN_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/components/Navbar', () => ({
  default: () => <nav data-testid="navbar" />,
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/utils/admin-health', () => ({
  isAdminAddress: vi.fn((addr: string | null | undefined) => addr === ADMIN_ADDRESS),
}));

const mockWallet = { address: ADMIN_ADDRESS as string | null };

vi.mock('@/context/WalletContext', () => ({
  useWallet: () => mockWallet,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminFlagDashboard', () => {
  describe('Admin-gating', () => {
    it('renders the flag list when the connected wallet is the admin', () => {
      mockWallet.address = ADMIN_ADDRESS;
      render(<AdminFlagDashboard />);
      expect(screen.getByTestId('flag-list')).toBeInTheDocument();
    });

    it('renders an access-restricted message for non-admin wallets', () => {
      mockWallet.address = 'GSOME_NON_ADMIN_ADDRESS_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
      render(<AdminFlagDashboard />);
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.queryByTestId('flag-list')).not.toBeInTheDocument();
    });

    it('renders an access-restricted message when no wallet is connected', () => {
      mockWallet.address = null;
      render(<AdminFlagDashboard />);
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.queryByTestId('flag-list')).not.toBeInTheDocument();
    });
  });

  describe('Flag state display', () => {
    beforeEach(() => {
      mockWallet.address = ADMIN_ADDRESS;
    });

    it('shows a row for each known feature flag', () => {
      render(<AdminFlagDashboard />);
      const rows = screen.getAllByTestId('flag-row');
      // Three flags: Insurance Pool, Oracle Badge, Invoice NFT
      expect(rows.length).toBe(3);
    });

    it('displays the Insurance Pool flag label', () => {
      render(<AdminFlagDashboard />);
      expect(screen.getByText('Insurance Pool')).toBeInTheDocument();
    });

    it('displays the Oracle Badge flag label', () => {
      render(<AdminFlagDashboard />);
      expect(screen.getByText('Oracle Badge')).toBeInTheDocument();
    });

    it('displays the Invoice NFT flag label', () => {
      render(<AdminFlagDashboard />);
      expect(screen.getByText('Invoice NFT')).toBeInTheDocument();
    });

    it('shows all flags as disabled when none of the env vars are set', () => {
      // Default env has all flags = false (booleanEnv defaults to false when unset).
      render(<AdminFlagDashboard />);
      const disabledBadges = screen.getAllByTestId('flag-disabled');
      expect(disabledBadges.length).toBe(3);
      expect(screen.queryByTestId('flag-enabled')).not.toBeInTheDocument();
    });

    it('shows an enabled badge when NEXT_PUBLIC_INSURANCE_POOL_ENABLED is true', () => {
      vi.stubEnv('NEXT_PUBLIC_INSURANCE_POOL_ENABLED', 'true');
      render(<AdminFlagDashboard />);
      const enabledBadges = screen.getAllByTestId('flag-enabled');
      expect(enabledBadges.length).toBeGreaterThanOrEqual(1);
      vi.unstubAllEnvs();
    });

    it('renders summary counts for total / enabled / disabled flags', () => {
      render(<AdminFlagDashboard />);
      // With all flags off: total=3, enabled=0, disabled=3
      expect(screen.getByText('3')).toBeInTheDocument(); // total
    });
  });

  describe('Page chrome', () => {
    beforeEach(() => {
      mockWallet.address = ADMIN_ADDRESS;
    });

    it('renders a Navbar', () => {
      render(<AdminFlagDashboard />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('renders the page heading', () => {
      render(<AdminFlagDashboard />);
      expect(screen.getByRole('heading', { name: /Feature Flag Status/i })).toBeInTheDocument();
    });

    it('renders the read-only disclaimer', () => {
      render(<AdminFlagDashboard />);
      expect(screen.getByText(/Read-only view/i)).toBeInTheDocument();
    });
  });
});
