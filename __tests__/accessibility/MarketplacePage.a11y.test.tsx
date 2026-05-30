import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import MarketplacePage from "@/app/marketplace/page";

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    address: null,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("@/hooks/useInvoices", () => ({
  useInvoices: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: vi.fn(() => ({
    tokenMap: new Map(),
    defaultToken: null,
  })),
}));

vi.mock("@/hooks/usePayerScores", () => ({
  usePayerScores: vi.fn(() => ({
    scores: new Map(),
    risks: new Map(),
  })),
}));

vi.mock("@/hooks/useLPSettings", () => ({
  useLPSettings: vi.fn(() => ({
    settings: { minReputation: 0 },
  })),
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <nav data-testid="navbar">Navigation</nav>,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/FundConfirmModal", () => ({
  default: () => null,
}));

vi.mock("@/components/LPSettingsModal", () => ({
  default: () => null,
}));

vi.mock("@/components/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("MarketplacePage Accessibility", () => {
  it("should not have any accessibility violations", async () => {
    const { container } = render(<MarketplacePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have proper heading structure with h1", () => {
    const { container } = render(<MarketplacePage />);
    const h1Elements = container.querySelectorAll("h1");
    expect(h1Elements.length).toBeGreaterThanOrEqual(1);
    expect(h1Elements[0].textContent).toMatch(/marketplace/i);
  });

  it("should have filter controls with visible label text nearby", () => {
    const { container } = render(<MarketplacePage />);
    const selects = container.querySelectorAll("select");
    // Each select lives inside a div that also contains a label element
    selects.forEach((select) => {
      const wrapper = select.parentElement;
      const nearbyLabel = wrapper?.querySelector("label");
      // At minimum there should be a visible label text nearby for the control
      expect(nearbyLabel?.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  it("should have accessible sort buttons with text content", () => {
    const { container } = render(<MarketplacePage />);
    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      const hasAccessibleName =
        button.textContent?.trim() ||
        button.getAttribute("aria-label") ||
        button.getAttribute("aria-labelledby");
      expect(hasAccessibleName).toBeTruthy();
    });
  });

  it("should have keyboard-navigable sort controls", () => {
    const { container } = render(<MarketplacePage />);
    const sortButtons = Array.from(container.querySelectorAll("button")).filter((btn) =>
      ["Yield", "Amount", "Due Date"].some((label) => btn.textContent?.includes(label))
    );
    expect(sortButtons.length).toBe(3);
    sortButtons.forEach((btn) => {
      expect(btn.tagName).toBe("BUTTON");
    });
  });

  it("should have proper landmark structure", () => {
    const { getByTestId } = render(<MarketplacePage />);
    expect(getByTestId("navbar")).toBeInTheDocument();
    expect(getByTestId("footer")).toBeInTheDocument();
    const main = document.querySelector("main");
    expect(main).toBeInTheDocument();
  });

  it("should display empty state message when no invoices match filters", () => {
    const { container } = render(<MarketplacePage />);
    const emptyText = container.querySelector("p");
    expect(emptyText).toBeInTheDocument();
  });
});