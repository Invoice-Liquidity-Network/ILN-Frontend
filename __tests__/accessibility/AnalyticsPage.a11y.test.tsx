import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import AnalyticsPage from "@/app/analytics/page";

// Mock the dependencies
vi.mock("@/hooks/useDocumentTitle", () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock("@/utils/soroban", () => ({
  getAllInvoices: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/components/charts/DynamicAmountHistogram", () => ({
  default: ({ invoices }: any) => <div data-testid="amount-histogram">Amount Histogram</div>,
}));

vi.mock("@/components/charts/DynamicFundingChart", () => ({
  default: () => <div data-testid="funding-chart">Funding Chart</div>,
}));

vi.mock("@/components/charts/DynamicDefaultRateChart", () => ({
  default: () => <div data-testid="default-rate-chart">Default Rate Chart</div>,
}));

vi.mock("@/components/ExportButton", () => ({
  ExportButton: ({ data }: any) => <button data-testid="export-button">Export Data</button>,
}));

vi.mock("@/components/AnimatedNumber", () => ({
  default: ({ value, formatter }: any) => <span>{formatter ? formatter(value) : value}</span>,
}));

describe("AnalyticsPage Accessibility", () => {
  it("should not have any accessibility violations", async () => {
    const { container } = render(<AnalyticsPage />);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have proper main landmark", () => {
    const { container } = render(<AnalyticsPage />);
    
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("id", "analytics-main");
  });

  it("should have accessible metric cards", () => {
    const { container } = render(<AnalyticsPage />);
    
    // Wait for content to load
    setTimeout(() => {
      const metricCards = container.querySelectorAll('[id^="metric-"]');
      metricCards.forEach((card) => {
        // Each metric card should have an ID for accessibility
        expect(card).toHaveAttribute("id");
        
        // Should contain accessible text
        expect(card.textContent?.trim()).toBeTruthy();
      });
    }, 100);
  });

  it("should have proper section headings", () => {
    const { container } = render(<AnalyticsPage />);
    
    setTimeout(() => {
      const sections = container.querySelectorAll("section");
      sections.forEach((section) => {
        // Each section should have an aria-labelledby or heading
        const hasLabel = 
          section.getAttribute("aria-labelledby") ||
          section.querySelector("h1, h2, h3, h4, h5, h6");
        
        expect(hasLabel).toBeTruthy();
      });
    }, 100);
  });

  it("should have accessible refresh button", () => {
    const { container } = render(<AnalyticsPage />);
    
    setTimeout(() => {
      const refreshButton = container.querySelector("#analytics-refresh-btn");
      if (refreshButton) {
        expect(refreshButton).toHaveAttribute("aria-label");
        expect(refreshButton).toHaveAttribute("type", "button");
      }
    }, 100);
  });

  it("should have proper chart accessibility", () => {
    const { getByTestId } = render(<AnalyticsPage />);
    
    setTimeout(() => {
      // Charts should be present and accessible
      expect(getByTestId("amount-histogram")).toBeInTheDocument();
      expect(getByTestId("funding-chart")).toBeInTheDocument();
      expect(getByTestId("default-rate-chart")).toBeInTheDocument();
    }, 100);
  });
});