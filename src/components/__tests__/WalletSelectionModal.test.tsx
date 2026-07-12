import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WalletSelectionModal from '../WalletSelectionModal';

afterEach(() => vi.unstubAllEnvs());

describe('WalletSelectionModal (#2)', () => {
  it('offers Freighter and WalletConnect options', () => {
    render(
      <WalletSelectionModal
        onClose={vi.fn()}
        onSelectFreighter={vi.fn()}
        onSelectWalletConnect={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /freighter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /walletconnect/i })).toBeInTheDocument();
  });

  it('connects via Freighter when chosen', () => {
    const onSelectFreighter = vi.fn();
    render(
      <WalletSelectionModal
        onClose={vi.fn()}
        onSelectFreighter={onSelectFreighter}
        onSelectWalletConnect={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /freighter/i }));
    expect(onSelectFreighter).toHaveBeenCalledTimes(1);
  });

  it('disables WalletConnect and explains when it is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', '');
    render(
      <WalletSelectionModal
        onClose={vi.fn()}
        onSelectFreighter={vi.fn()}
        onSelectWalletConnect={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /walletconnect/i })).toBeDisabled();
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
  });

  it('shows a pairing QR when WalletConnect is configured and selected', () => {
    vi.stubEnv('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 'proj123');
    render(
      <WalletSelectionModal
        onClose={vi.fn()}
        onSelectFreighter={vi.fn()}
        onSelectWalletConnect={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /walletconnect/i }));
    expect(screen.getByText(/scan with a walletconnect wallet/i)).toBeInTheDocument();
  });

  it('persists the WalletConnect provider preference when selected', () => {
    vi.stubEnv('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 'proj123');
    const onSelectWalletConnect = vi.fn();
    render(
      <WalletSelectionModal
        onClose={vi.fn()}
        onSelectFreighter={vi.fn()}
        onSelectWalletConnect={onSelectWalletConnect}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /walletconnect/i }));
    expect(onSelectWalletConnect).toHaveBeenCalledTimes(1);
  });
});
