import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import InvoiceLifecycleTimeline from '../InvoiceLifecycleTimeline';

expect.extend(toHaveNoViolations);

describe('InvoiceLifecycleTimeline (#12)', () => {
  it('renders the three happy-path steps', () => {
    render(<InvoiceLifecycleTimeline status="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Funded')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('marks the current step for an in-progress invoice', () => {
    render(<InvoiceLifecycleTimeline status="Funded" />);
    // The inner focusable div gets aria-current
    const currentContainer = screen.getByText('Current step: Invoice funded').closest('div');
    expect(currentContainer?.getAttribute('aria-current')).toBe('step');
    // Pending precedes Funded, so it is completed (rendered as a checkmark).
    const pendingContainer = screen.getByText('Completed step: Invoice pending').closest('li');
    expect(pendingContainer?.textContent).toContain('✓');
  });

  it('shows every prior step completed once Paid', () => {
    render(<InvoiceLifecycleTimeline status="Paid" />);
    const pendingContainer = screen.getByText('Completed step: Invoice pending').closest('li');
    const fundedContainer = screen.getByText('Completed step: Invoice funded').closest('li');
    expect(pendingContainer?.textContent).toContain('✓');
    expect(fundedContainer?.textContent).toContain('✓');
    // Paid is the current (final) step.
    const paidContainer = screen.getByText('Current step: Invoice paid').closest('div');
    expect(paidContainer?.getAttribute('aria-current')).toBe('step');
  });

  it('replaces the final step with a terminal state for Cancelled invoices without marking Funded done', () => {
    render(<InvoiceLifecycleTimeline status="Cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByText('Paid')).not.toBeInTheDocument();
    expect(screen.getByText('Completed step: Invoice pending')).toBeInTheDocument();
    expect(screen.getByText('Upcoming step: Invoice funded')).toBeInTheDocument();
    expect(screen.getByText('Current step: Invoice cancelled')).toBeInTheDocument();
  });

  it('surfaces Defaulted as a terminal state after Funded', () => {
    render(<InvoiceLifecycleTimeline status="Defaulted" />);
    expect(screen.getByText('Defaulted')).toBeInTheDocument();
    expect(screen.queryByText('Paid')).not.toBeInTheDocument();
    expect(screen.getByText('Completed step: Invoice pending')).toBeInTheDocument();
    expect(screen.getByText('Completed step: Invoice funded')).toBeInTheDocument();
    expect(screen.getByText('Current step: Invoice defaulted')).toBeInTheDocument();
  });

  it('surfaces Disputed as a terminal off-happy-path state after Funded', () => {
    render(<InvoiceLifecycleTimeline status="Disputed" />);
    expect(screen.getByText('Disputed')).toBeInTheDocument();
    expect(screen.queryByText('Paid')).not.toBeInTheDocument();
    expect(screen.getByText('Completed step: Invoice pending')).toBeInTheDocument();
    expect(screen.getByText('Completed step: Invoice funded')).toBeInTheDocument();
    expect(screen.getByText('Current step: Invoice disputed')).toBeInTheDocument();
  });

  it('renders PartiallyFunded as an active nonterminal step', () => {
    render(<InvoiceLifecycleTimeline status="PartiallyFunded" />);
    expect(screen.getByText('Partially Funded')).toBeInTheDocument();
    expect(screen.getByText('Completed step: Invoice pending')).toBeInTheDocument();
    expect(screen.getByText('Current step: Invoice partially funded')).toBeInTheDocument();
    expect(screen.getByText('Upcoming step: Invoice paid')).toBeInTheDocument();
  });

  it('fails visibly with an alert for unknown or empty contract states', () => {
    const { rerender } = render(<InvoiceLifecycleTimeline status="Archived" />);
    const alert = screen.getByRole('alert', { name: 'Invoice lifecycle status' });
    expect(alert).toHaveTextContent('Unknown invoice status: Archived');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    rerender(<InvoiceLifecycleTimeline status="" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unknown invoice status: None');
  });

  it('has semantic ARIA list roles', () => {
    render(<InvoiceLifecycleTimeline status="Pending" />);
    const list = screen.getByRole('list', { name: 'Invoice lifecycle status' });
    expect(list).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('has accessible screen reader text for transitions', () => {
    render(<InvoiceLifecycleTimeline status="Funded" />);
    expect(screen.getByText('Completed step: Invoice pending')).toBeInTheDocument();
    expect(screen.getByText('Current step: Invoice funded')).toBeInTheDocument();
    expect(screen.getByText('Upcoming step: Invoice paid')).toBeInTheDocument();
  });

  it('supports keyboard navigation between steps', () => {
    render(<InvoiceLifecycleTimeline status="Pending" />);
    const items = screen.getAllByRole('listitem').map((li) => li.querySelector('div[tabindex]'));

    // First item should be focusable
    expect(items[0]).toHaveAttribute('tabIndex', '0');
    expect(items[1]).toHaveAttribute('tabIndex', '-1');

    (items[0] as HTMLElement)?.focus();
    expect(document.activeElement).toBe(items[0]);

    // ArrowRight moves focus to the second item
    if (items[0]) {
      fireEvent.keyDown(items[0], { key: 'ArrowRight' });
    }
    expect(document.activeElement).toBe(items[1]);
    expect(items[1]).toHaveAttribute('tabIndex', '0');

    // ArrowLeft moves focus back to first item
    if (items[1]) {
      fireEvent.keyDown(items[1], { key: 'ArrowLeft' });
    }
    expect(document.activeElement).toBe(items[0]);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<InvoiceLifecycleTimeline status="Pending" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
