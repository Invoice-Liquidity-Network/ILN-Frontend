import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WhatsNewModal from "../WhatsNewModal";
import * as useWhatsNewHook from "@/hooks/useWhatsNew";

vi.mock("@/hooks/useWhatsNew", () => ({
  useWhatsNew: vi.fn(),
}));

describe("WhatsNewModal", () => {
  const mockDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    (useWhatsNewHook.useWhatsNew as any).mockReturnValue({
      isOpen: false,
      dismiss: mockDismiss,
      items: [],
      currentVersion: "v1.5.0",
    });

    const { container } = render(<WhatsNewModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when isOpen is true", () => {
    (useWhatsNewHook.useWhatsNew as any).mockReturnValue({
      isOpen: true,
      dismiss: mockDismiss,
      currentVersion: "v1.5.0",
      items: [
        {
          id: "feature-1",
          icon: "🚀",
          title: "New Feature",
          description: "This is a great new feature.",
          version: "v1.5.0",
        },
      ],
    });

    render(<WhatsNewModal />);

    // Header and Version
    expect(screen.getByText(/What's New in/)).toBeInTheDocument();
    expect(screen.getByText("v1.5.0")).toBeInTheDocument();

    // Features
    expect(screen.getByText("🚀")).toBeInTheDocument();
    expect(screen.getByText("New Feature")).toBeInTheDocument();
    expect(screen.getByText("This is a great new feature.")).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole("link", { name: /See full changelog/i })).toHaveAttribute("href", "/changelog");
    expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument();
  });

  it("calls dismiss when 'Got it' is clicked", async () => {
    const user = userEvent.setup();
    (useWhatsNewHook.useWhatsNew as any).mockReturnValue({
      isOpen: true,
      dismiss: mockDismiss,
      currentVersion: "v1.5.0",
      items: [],
    });

    render(<WhatsNewModal />);

    const dismissBtn = screen.getByRole("button", { name: "Got it" });
    await user.click(dismissBtn);

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss when 'Escape' key is pressed", () => {
    (useWhatsNewHook.useWhatsNew as any).mockReturnValue({
      isOpen: true,
      dismiss: mockDismiss,
      currentVersion: "v1.5.0",
      items: [],
    });

    render(<WhatsNewModal />);
    
    // Simulating escape press
    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss when 'See full changelog' is clicked", async () => {
    const user = userEvent.setup();
    (useWhatsNewHook.useWhatsNew as any).mockReturnValue({
      isOpen: true,
      dismiss: mockDismiss,
      currentVersion: "v1.5.0",
      items: [],
    });

    render(<WhatsNewModal />);

    const link = screen.getByRole("link", { name: /See full changelog/i });
    await user.click(link);

    // Should dismiss the modal so it doesn't stay open behind the scenes
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});
