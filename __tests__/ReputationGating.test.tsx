import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoiceMarketplaceCard from '../src/components/InvoiceMarketplaceCard';
import { Invoice } from '../src/utils/soroban';

const mockInvoice: Invoice = {
  id: 123n,
  status: 'Pending',
  freelancer: 'GDTEST...',
  payer: 'PAYER_ADDR',
  amount: 1000n * 10n ** 7n, // 1000 USDC
  due_date: 9999999999n,
  discount_rate: 500,
  token: 'USDC_ID',
};

const mockPayerScore = {
  score: 45,
  settled_on_time: 3,
  defaults: 1,
};

const mockTokenMap = new Map();
mockTokenMap.set('USDC_ID', { contractId: 'USDC_ID', symbol: 'USDC', decimals: 7 });

describe('InvoiceMarketplaceCard - Reputation Gating', () => {
  it('dims the card and disables the fund button when reputation is below threshold', () => {
    const { container } = render(
      <InvoiceMarketplaceCard
        invoice={mockInvoice}
        tokenMap={mockTokenMap}
        defaultToken={null}
        payerScore={mockPayerScore}
        payerRisk="Medium"
        onFund={vi.fn()}
        isWalletConnected={true}
        minReputation={50} // Score is 45, so below threshold
      />
    );

    // The card should have opacity-50 class
    expect(container.firstChild).toHaveClass('opacity-50');

    // "Fund Invoice" should be replaced by "Threshold Not Met"
    expect(screen.queryByText('Fund Invoice')).not.toBeInTheDocument();
    const disabledBtn = screen.getByText('Threshold Not Met');
    expect(disabledBtn).toBeDisabled();

    // Should show "Fund Anyway" button
    expect(screen.getByText('Fund Anyway')).toBeInTheDocument();
  });

  it("removes dimming and enables funding when 'Fund Anyway' is clicked", () => {
    const onFund = vi.fn();
    const { container } = render(
      <InvoiceMarketplaceCard
        invoice={mockInvoice}
        tokenMap={mockTokenMap}
        defaultToken={null}
        payerScore={mockPayerScore}
        payerRisk="Medium"
        onFund={onFund}
        isWalletConnected={true}
        minReputation={50}
      />
    );

    const anywayBtn = screen.getByText('Fund Anyway');
    fireEvent.click(anywayBtn);

    // Card should no longer be dimmed
    expect(container.firstChild).not.toHaveClass('opacity-50');

    // Main button should now be "Fund Invoice"
    const fundBtn = screen.getByText('Fund Invoice');
    fireEvent.click(fundBtn);
    expect(onFund).toHaveBeenCalledWith(mockInvoice);
  });

  it('shows card normally when reputation is above threshold', () => {
    const { container } = render(
      <InvoiceMarketplaceCard
        invoice={mockInvoice}
        tokenMap={mockTokenMap}
        defaultToken={null}
        payerScore={mockPayerScore}
        payerRisk="Medium"
        onFund={vi.fn()}
        isWalletConnected={true}
        minReputation={30} // Score is 45, so above threshold
      />
    );

    expect(container.firstChild).not.toHaveClass('opacity-50');
    expect(screen.getByText('Fund Invoice')).toBeInTheDocument();
    expect(screen.queryByText('Fund Anyway')).not.toBeInTheDocument();
  });
});
