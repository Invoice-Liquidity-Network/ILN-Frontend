import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PayerReputationCard, { assessPayerReputation } from '../PayerReputationCard';

const getReputationMock = vi.fn();
vi.mock('@/utils/soroban', () => ({
  getReputation: (...args: unknown[]) => getReputationMock(...args),
}));

describe('PayerReputationCard', () => {
  beforeEach(() => {
    getReputationMock.mockReset();
  });

  it('shows a skeleton while loading', () => {
    getReputationMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(<PayerReputationCard address="GADDR" />);
    expect(
      container.querySelectorAll('[class*="animate-pulse"], [class*="Skeleton"]').length + 1
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Reputation')).not.toBeInTheDocument();
  });

  it('renders the score and stats once loaded', async () => {
    getReputationMock.mockResolvedValue({
      score: 87,
      invoices_paid: 5,
      invoices_defaulted: 1,
      invoices_submitted: 6,
    });
    render(<PayerReputationCard address="GADDR" />);

    await screen.findByText('Reputation');
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(getReputationMock).toHaveBeenCalledWith('GADDR');
  });

  it('defaults stats to zero when reputation is null', async () => {
    getReputationMock.mockResolvedValue(null);
    render(<PayerReputationCard address="GADDR" />);

    await screen.findByText('Reputation');
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('logs and stops loading when getReputation rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getReputationMock.mockRejectedValue(new Error('network error'));
    render(<PayerReputationCard address="GADDR" />);

    await screen.findByText('Reputation');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load reputation:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('reloads when refreshTrigger changes', async () => {
    getReputationMock.mockResolvedValue({
      score: 50,
      invoices_paid: 1,
      invoices_defaulted: 0,
      invoices_submitted: 1,
    });
    const { rerender } = render(<PayerReputationCard address="GADDR" refreshTrigger={1} />);
    await screen.findByText('Reputation');
    expect(getReputationMock).toHaveBeenCalledTimes(1);

    rerender(<PayerReputationCard address="GADDR" refreshTrigger={2} />);
    await waitFor(() => expect(getReputationMock).toHaveBeenCalledTimes(2));
  });

  it('shows the info tooltip on mouse enter and hides it on mouse leave', async () => {
    getReputationMock.mockResolvedValue({
      score: 60,
      invoices_paid: 2,
      invoices_defaulted: 0,
      invoices_submitted: 2,
    });
    render(<PayerReputationCard address="GADDR" />);
    await screen.findByText('Reputation');

    const infoIcon = screen.getByText('info');
    fireEvent.mouseEnter(infoIcon.parentElement!);
    expect(
      screen.getByText('Your score affects whether LPs are willing to fund your invoices')
    ).toBeInTheDocument();

    fireEvent.mouseLeave(infoIcon.parentElement!);
    expect(
      screen.queryByText('Your score affects whether LPs are willing to fund your invoices')
    ).not.toBeInTheDocument();
  });

  it('toggles the info tooltip on click', async () => {
    getReputationMock.mockResolvedValue({
      score: 60,
      invoices_paid: 2,
      invoices_defaulted: 0,
      invoices_submitted: 2,
    });
    render(<PayerReputationCard address="GADDR" />);
    await screen.findByText('Reputation');

    const infoIcon = screen.getByText('info');
    fireEvent.click(infoIcon);
    expect(
      screen.getByText('Your score affects whether LPs are willing to fund your invoices')
    ).toBeInTheDocument();

    fireEvent.click(infoIcon);
    expect(
      screen.queryByText('Your score affects whether LPs are willing to fund your invoices')
    ).not.toBeInTheDocument();
  });

  it('does not style or label null reputation as trusted or defaulted', async () => {
    getReputationMock.mockResolvedValue(null);
    render(<PayerReputationCard address="GADDR" />);

    await screen.findByText('Reputation');
    expect(screen.getByTestId('reputation-score-value')).toHaveTextContent('N/A');
    expect(screen.getByTestId('reputation-tier-badge')).toHaveTextContent('Insufficient history');
    expect(screen.getByTestId('reputation-insufficient-history')).toBeInTheDocument();

    const ringClass = screen.getByTestId('reputation-score-ring').getAttribute('class') ?? '';
    expect(ringClass).not.toContain('text-emerald-500');
    expect(ringClass).not.toContain('text-red-500');
  });

  it('prevents high baseline score with zero settled invoices from appearing trusted', async () => {
    getReputationMock.mockResolvedValue({
      score: 100,
      invoices_paid: 0,
      invoices_defaulted: 0,
      invoices_submitted: 2,
    });
    render(<PayerReputationCard address="GADDR" />);

    await screen.findByText('Reputation');
    expect(screen.getByTestId('reputation-score-value')).toHaveTextContent('N/A');
    expect(screen.getByTestId('reputation-tier-badge')).toHaveTextContent('Insufficient history');
    expect(screen.getByTestId('reputation-tier-badge')).not.toHaveTextContent('Trusted');
    expect(screen.getByTestId('reputation-insufficient-history')).toBeInTheDocument();

    const ringClass = screen.getByTestId('reputation-score-ring').getAttribute('class') ?? '';
    expect(ringClass).not.toContain('text-emerald-500');
  });

  it('styles sufficient high-score history as Trusted', async () => {
    getReputationMock.mockResolvedValue({
      score: 92,
      invoices_paid: 4,
      invoices_defaulted: 0,
      invoices_submitted: 4,
    });
    render(<PayerReputationCard address="GADDR" />);

    await screen.findByText('Reputation');
    expect(screen.getByTestId('reputation-score-value')).toHaveTextContent('92');
    expect(screen.getByTestId('reputation-tier-badge')).toHaveTextContent('Trusted');
    expect(screen.queryByTestId('reputation-insufficient-history')).not.toBeInTheDocument();

    const ringClass = screen.getByTestId('reputation-score-ring').getAttribute('class') ?? '';
    expect(ringClass).toContain('text-emerald-500');
  });
});

describe('assessPayerReputation', () => {
  it('returns unavailable neutral state when isError is true and reputation is missing', () => {
    const res = assessPayerReputation(null, true);
    expect(res.tier).toBe('unavailable');
    expect(res.hasSufficientHistory).toBe(false);
    expect(res.displayScore).toBeNull();
    expect(res.ringScore).toBe(0);
    expect(res.ringColorClass).not.toContain('text-emerald-500');
  });

  it('clamps out-of-range scores when settled history exists', () => {
    const high = assessPayerReputation({
      score: 140,
      invoices_paid: 2,
      invoices_defaulted: 0,
      invoices_submitted: 2,
    });
    expect(high.displayScore).toBe(100);
    expect(high.tier).toBe('trusted');

    const low = assessPayerReputation({
      score: -10,
      invoices_paid: 0,
      invoices_defaulted: 1,
      invoices_submitted: 1,
    });
    expect(low.displayScore).toBe(0);
    expect(low.tier).toBe('low');
    expect(low.ringColorClass).toContain('text-red-500');
  });
});
