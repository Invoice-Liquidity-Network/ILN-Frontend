import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import HomePage from "@/app/page";

// Mock the hooks and components
vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    address: null,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDocumentTitle", () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock("@/components/Hero", () => ({
  default: () => <div data-testid="hero">Hero Component</div>,
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <nav data-testid="navbar">Navigation</nav>,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

describe("HomePage Accessibility", () => {
  it("should not have any accessibility violations", async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have proper heading structure", () => {
    const { container } = render(<HomePage />);
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    
    // Should have at least one h1
    const h1Elements = container.querySelectorAll("h1");
    expect(h1Elements.length).toBeGreaterThanOrEqual(1);
  });

  it("should have proper landmark structure", () => {
    const { getByTestId } = render(<HomePage />);
    
    expect(getByTestId("navbar")).toBeInTheDocument();
    expect(getByTestId("hero")).toBeInTheDocument();
    expect(getByTestId("footer")).toBeInTheDocument();
  });
});