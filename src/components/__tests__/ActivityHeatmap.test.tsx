import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import type { Invoice } from '@/utils/soroban';

const NOW = new Date('2026-06-26T12:00:00Z').getTime();
// 14 days ago — well within the 52-week window
const RECENT_UNIX = Math.floor((NOW - 14 * 24 * 60 * 60 * 1000) / 1000);

const invoices: Invoice[] = [
  {
    id: 1n,
    status: 'Funded',
    freelancer: 'GADDR',
    payer: 'GPAYER',
    funder: 'GLP',
    amount: 500_000_000n, // 50.00 at 7 decimals
    due_date: BigInt(RECENT_UNIX),
    discount_rate: 100,
    funded_at: BigInt(RECENT_UNIX),
  },
];

describe('ActivityHeatmap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an SVG grid with accessible labels', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    expect(screen.getByRole('img', { name: /activity heatmap/i })).toBeInTheDocument();
    expect(screen.getByText(/Activity heatmap/i)).toBeInTheDocument();
  });

  it('renders 364 focusable grid cells (52 weeks × 7 days)', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    expect(screen.getAllByRole('gridcell')).toHaveLength(52 * 7);
  });

  it('shows tooltip on mouse enter', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    fireEvent.mouseEnter(screen.getAllByRole('gridcell')[0]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    const cell = screen.getAllByRole('gridcell')[0];
    fireEvent.mouseEnter(cell);
    fireEvent.mouseLeave(cell);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus (keyboard accessible)', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    fireEvent.focus(screen.getAllByRole('gridcell')[0]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on blur', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    const cell = screen.getAllByRole('gridcell')[0];
    fireEvent.focus(cell);
    fireEvent.blur(cell);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows "No activity" for empty cells', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    // First cell is the oldest date in the window — no invoices there
    fireEvent.mouseEnter(screen.getAllByRole('gridcell')[0]);
    expect(screen.getByRole('tooltip')).toHaveTextContent('No activity');
  });

  it('shows action count in tooltip for active cells', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    const cells = screen.getAllByRole('gridcell');
    const activeCell = cells.find((c) => c.getAttribute('aria-label')?.match(/\d+ action/));
    expect(activeCell).toBeDefined();
    fireEvent.mouseEnter(activeCell!);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).not.toHaveTextContent('No activity');
    expect(tooltip).toHaveTextContent(/action/);
  });

  it('shows date in tooltip', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    fireEvent.mouseEnter(screen.getAllByRole('gridcell')[0]);
    // Tooltip always shows a formatted date string
    expect(screen.getByRole('tooltip').textContent?.length).toBeGreaterThan(0);
  });

  it('shows total amount for active cells with non-zero amount', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    const cells = screen.getAllByRole('gridcell');
    const activeCell = cells.find((c) => c.getAttribute('aria-label')?.match(/\d+ action/));
    expect(activeCell).toBeDefined();
    fireEvent.mouseEnter(activeCell!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('total');
  });

  it('each cell has an aria-label describing its activity', () => {
    render(<ActivityHeatmap address="GADDR" invoices={invoices} />);
    const cells = screen.getAllByRole('gridcell');
    cells.forEach((cell) => {
      expect(cell).toHaveAttribute('aria-label');
      expect(cell.getAttribute('aria-label')!.length).toBeGreaterThan(0);
    });
  });
});
