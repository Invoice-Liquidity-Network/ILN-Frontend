import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LPOnboardingModal from '../LPOnboardingModal';

vi.mock('@/context/WalletContext', () => ({
  useWallet: () => ({
    address: null,
    isConnected: false,
    isInstalled: true,
    connect: vi.fn(),
  }),
}));

describe('LPOnboardingModal', () => {
  it('renders all four steps and updates the progress indicator', () => {
    const onClose = vi.fn();
    const onGoToMarketplace = vi.fn();

    render(
      <LPOnboardingModal isOpen={true} onClose={onClose} onGoToMarketplace={onGoToMarketplace} />
    );

    expect(screen.getByRole('heading', { name: /welcome to iln/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Yield')).toBeInTheDocument();
    expect(screen.getByText('Fund')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('heading', { name: /connect your wallet/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(
      screen.getByRole('heading', { name: /understanding yield mechanics/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(
      screen.getByRole('heading', { name: /your first funding walkthrough/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('button', { name: /go to marketplace/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /go to marketplace/i }));
    expect(onGoToMarketplace).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows skipping onboarding at any step', () => {
    const onClose = vi.fn();

    render(<LPOnboardingModal isOpen={true} onClose={onClose} onGoToMarketplace={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /skip onboarding/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /skip onboarding/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
