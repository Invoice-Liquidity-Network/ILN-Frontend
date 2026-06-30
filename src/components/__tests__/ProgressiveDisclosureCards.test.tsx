import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import ProgressiveDisclosureCards, { DisclosureColumn } from '../ProgressiveDisclosureCards';

interface Row {
  id: string;
  status: string;
  amount: string;
  payer: string;
  due: string;
}

const data: Row[] = [
  { id: '1', status: 'Paid', amount: '$100', payer: 'GABC', due: '2026-01-01' },
  { id: '2', status: 'Funded', amount: '$200', payer: 'GXYZ', due: '2026-02-01' },
];

const columns: DisclosureColumn<Row>[] = [
  { id: 'id', label: 'Invoice ID', renderCell: (r) => `#${r.id}` },
  { id: 'status', label: 'Status', renderCell: (r) => r.status },
  { id: 'amount', label: 'Amount', renderCell: (r) => r.amount },
  { id: 'payer', label: 'Payer', renderCell: (r) => r.payer },
  { id: 'due', label: 'Due Date', renderCell: (r) => r.due },
];

const renderCards = () =>
  render(
    <ProgressiveDisclosureCards
      data={data}
      columns={columns}
      keyExtractor={(r) => r.id}
      keyColumnIds={['id', 'status', 'amount']}
    />
  );

describe('ProgressiveDisclosureCards', () => {
  it('shows key columns collapsed and hides detail columns', () => {
    renderCards();
    // Key columns visible
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    // Detail panel is collapsed
    const toggles = screen.getAllByRole('button');
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(toggles[0].getAttribute('aria-controls')!);
    expect(panel).toBeTruthy();
    expect(panel).toHaveAttribute('hidden');
  });

  it('expands a row to reveal all fields when activated (ARIA expanded)', () => {
    renderCards();
    const toggle = screen.getAllByRole('button')[0];
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!);
    expect(panel).not.toHaveAttribute('hidden');
    // Detail fields now present
    expect(screen.getByText('GABC')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
  });

  it('toggles independently per row and can collapse again', () => {
    renderCards();
    const [first, second] = screen.getAllByRole('button');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  it('is keyboard accessible (toggle is a native button)', () => {
    renderCards();
    const toggle = screen.getAllByRole('button')[0];
    expect(toggle.tagName).toBe('BUTTON');
    toggle.focus();
    expect(toggle).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderCards();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
