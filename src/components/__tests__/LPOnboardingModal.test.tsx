import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LPOnboardingModal from "../LPOnboardingModal";

describe("LPOnboardingModal", () => {
  it("renders the first step and advances through all steps", () => {
    const onClose = vi.fn();
    const onGoToMarketplace = vi.fn();

    render(
      <LPOnboardingModal
        isOpen={true}
        onClose={onClose}
        onGoToMarketplace={onGoToMarketplace}
      />
    );

    expect(screen.getByRole("heading", { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("heading", { name: /understanding yield and risk/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("heading", { name: /try the marketplace/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to marketplace/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /go to marketplace/i }));
    expect(onGoToMarketplace).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("allows skipping onboarding at any step", () => {
    const onClose = vi.fn();

    render(
      <LPOnboardingModal
        isOpen={true}
        onClose={onClose}
        onGoToMarketplace={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /skip onboarding/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
