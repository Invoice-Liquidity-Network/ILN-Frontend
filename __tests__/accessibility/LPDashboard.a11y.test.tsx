import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import LPDashboard from "@/components/LPDashboard";

// Mock all the dependencies
vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    address: "GTEST123",
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({
    addToast: vi.fn(),
    updateToast: vi.fn(),
  }),
}));

vi.mock("@/context/NotificationContext", () => ({
  useNotification: () => ({
    addNotification: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTransaction", () => ({
  useTransaction: () => ({
    execute: vi.fn(),
    loading: false,
    signingModal: null,
  }),
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokenMap: new Map(),
    defaultToken: { symbol: "USDC", address: "CUSDC123" },
  }),
}));

vi.mock("@/hooks/useInvoices", () => ({
  useInvoices: () => ({
    data: [],
    isLoading: false,
    dataUpdatedAt: Date.now(),
  }),
}));

vi.mock("@/hooks/usePositionPolling", () => ({
  usePositionPolling: vi.fn(),
}));

vi.mock("@/hooks/useInvoiceFilters", () => ({
  useInvoiceFilters: () => ({
    filters: {},
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    activeFilterCount: 0,
  }),
}));

vi.mock("@/hooks/useWatchlist", () => ({
  useWatchlist: () => ({
    watchlist: [],
    toggleWatchlist: vi.fn(),
    isInWatchlist: vi.fn(() => false),
  }),
}));

vi.mock("@/hooks/usePayerScores", () => ({
  usePayerScores: () => ({
    scores: new Map(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useLPSettings", () => ({
  useLPSettings: () => ({
    settings: {
      riskTolerance: "medium",
      autoFunding: false,
    },
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("LPDashboard Accessibility", () => {
  it("should not have any accessibility violations", async () => {
    const { container } = render(<LPDashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have proper tab navigation structure", () => {
    const { container } = render(<LPDashboard />);
    
    // Check for tab buttons
    const tabButtons = container.querySelectorAll('[role="tab"]');
    expect(tabButtons.length).toBeGreaterThan(0);
    
    // Each tab should have proper ARIA attributes
    tabButtons.forEach((tab) => {
      expect(tab).toHaveAttribute("aria-selected");
      expect(tab).toHaveAttribute("aria-controls");
    });
  });

  it("should have accessible table structure", () => {
    const { container } = render(<LPDashboard />);
    
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      // Tables should have headers
      const headers = table.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);
      
      // Headers should have proper scope
      headers.forEach((header) => {
        expect(header).toHaveAttribute("scope");
      });
    });
  });

  it("should have proper button accessibility", () => {
    const { container } = render(<LPDashboard />);
    
    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      // Buttons should have accessible names
      const hasAccessibleName = 
        button.textContent?.trim() ||
        button.getAttribute("aria-label") ||
        button.getAttribute("aria-labelledby");
      
      expect(hasAccessibleName).toBeTruthy();
    });
  });
});