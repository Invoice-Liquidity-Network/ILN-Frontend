import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VotingPowerCard from "../VotingPowerCard";

describe("VotingPowerCard", () => {
  it("shows own and incoming voting power separately", () => {
    render(
      <VotingPowerCard
        isConnected
        onConnect={vi.fn()}
        breakdown={{ ownBalance: 1250, incomingDelegated: 350 }}
      />,
    );

    expect(screen.getByText("Your Voting Power")).toBeInTheDocument();
    expect(screen.getByText("1.6K ILN")).toBeInTheDocument();
    expect(screen.getByText("Own balance")).toBeInTheDocument();
    expect(screen.getByText("1.3K ILN")).toBeInTheDocument();
    expect(screen.getByText("Incoming delegation")).toBeInTheDocument();
    expect(screen.getByText("350 ILN")).toBeInTheDocument();
  });

  it("shows delegated-away state with no effective voting power", () => {
    render(
      <VotingPowerCard
        isConnected
        onConnect={vi.fn()}
        breakdown={{
          ownBalance: 1250,
          incomingDelegated: 350,
          delegatedTo: "GDELEGATE7ZDJVQV6VMB4EJQ5X2YJH5R7GQCMQX2HBJFW42VMMOCKADDR",
        }}
      />,
    );

    expect(screen.getByText("0 ILN")).toBeInTheDocument();
    expect(screen.getByText(/Your voting power is currently delegated to/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage delegation/i })).toHaveAttribute(
      "href",
      "#delegation-management",
    );
  });

  it("prompts disconnected users to connect", () => {
    const onConnect = vi.fn();

    render(<VotingPowerCard isConnected={false} breakdown={null} onConnect={onConnect} />);
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));

    expect(onConnect).toHaveBeenCalledOnce();
  });
});
