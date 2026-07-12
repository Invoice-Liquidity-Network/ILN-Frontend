import { render, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import AnalyticsPage from '@/app/analytics/page';

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/utils/soroban', () => ({
  getAllInvoices: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/components/charts/DynamicAmountHistogram', () => ({
  default: ({ invoices }: any) => <div data-testid="amount-histogram">Amount Histogram</div>,
}));

vi.mock('@/components/charts/DynamicFundingChart', () => ({
  default: () => <div data-testid="funding-chart">Funding Chart</div>,
}));

vi.mock('@/components/charts/DynamicDefaultRateChart', () => ({
  default: () => <div data-testid="default-rate-chart">Default Rate Chart</div>,
}));

vi.mock('@/components/ExportButton', () => ({
  ExportButton: ({ data }: any) => <button data-testid="export-button">Export Data</button>,
}));

vi.mock('@/components/AnimatedNumber', () => ({
  default: ({ value, formatter }: any) => <span>{formatter ? formatter(value) : value}</span>,
}));

describe('AnalyticsPage Accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(<AnalyticsPage />);

    await waitFor(() => {
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper main landmark', async () => {
    const { container } = render(<AnalyticsPage />);

    await waitFor(() => {
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('id', 'analytics-main');
    });
  });

  it('should show loading state with accessible spinner', async () => {
    const { container } = render(<AnalyticsPage />);

    await waitFor(() => {
      const spinner = container.querySelector("[aria-hidden='true']");
      expect(spinner).toBeInTheDocument();
      const loadingText = container.querySelector('p');
      expect(loadingText?.textContent).toMatch(/loading/i);
    });
  });
});
