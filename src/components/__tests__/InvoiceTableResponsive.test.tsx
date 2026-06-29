import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import InvoiceTable, { ColumnDefinition } from '../InvoiceTable';

interface Row {
  id: string;
  status: string;
  amount: string;
  payer: string;
}

const columns: ColumnDefinition<Row>[] = [
  { id: 'id', label: 'ID', isMandatory: true, isKeyColumn: true, renderCell: (r) => `#${r.id}` },
  {
    id: 'status',
    label: 'Status',
    isMandatory: true,
    isKeyColumn: true,
    renderCell: (r) => r.status,
  },
  { id: 'amount', label: 'Amount', isKeyColumn: true, renderCell: (r) => r.amount },
  { id: 'payer', label: 'Payer', renderCell: (r) => r.payer },
];

const data: Row[] = [{ id: '1', status: 'Paid', amount: '$100', payer: 'GABC' }];

const original = window.matchMedia;

function setViewport(isMobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: isMobile,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('InvoiceTable responsive progressive disclosure', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: original,
    });
  });

  it('renders a full <table> on desktop', () => {
    setViewport(false);
    const { container } = render(
      <InvoiceTable
        tableId="resp_desktop"
        data={data}
        columns={columns}
        keyExtractor={(r) => r.id}
      />
    );
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(screen.getByText('GABC')).toBeInTheDocument();
  });

  it('renders progressive disclosure cards (no table) on mobile', () => {
    setViewport(true);
    const { container } = render(
      <InvoiceTable
        tableId="resp_mobile"
        data={data}
        columns={columns}
        keyExtractor={(r) => r.id}
      />
    );
    // No desktop table
    expect(container.querySelector('table')).not.toBeInTheDocument();
    // Key columns are visible, detail column is hidden until expanded
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();

    const toggle = screen.getAllByRole('button').find((b) => b.hasAttribute('aria-expanded'))!;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('GABC')).toBeInTheDocument();
  });
});
