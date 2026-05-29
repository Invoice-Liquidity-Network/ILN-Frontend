import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VoteDelegationPanel from "../VoteDelegationPanel";

const connectedAddress = `G${"E".repeat(55)}`;
const delegateAddress = `G${"F".repeat(55)}`;
const reverseDelegatorAddress = `G${"D".repeat(55)}`;

const walletState = {
  address: connectedAddress as string | null,
  isConnected: true,
  connect: vi.fn(),
  signTx: vi.fn().mockResolvedValue("signed-xdr"),
};

const getDelegationStatus = vi.fn();
const resolveDelegateAddress = vi.fn();
const wouldCreateDelegationCycle = vi.fn();
const delegateVotes = vi.fn();
const undelegateVotes = vi.fn();
const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast, removeToast: vi.fn() }),
}));

vi.mock("@/utils/governance", () => ({
  delegateVotes: (...args: unknown[]) => delegateVotes(...args),
  formatVotingPower: (power: number) => `${power.toLocaleString()} ILN`,
  getDelegationStatus: (...args: unknown[]) => getDelegationStatus(...args),
  isValidStellarAddress: (address: string) => /^G[A-Z2-7]{55}$/.test(address),
  resolveDelegateAddress: (...args: unknown[]) => resolveDelegateAddress(...args),
  undelegateVotes: (...args: unknown[]) => undelegateVotes(...args),
  wouldCreateDelegationCycle: (...args: unknown[]) => wouldCreateDelegationCycle(...args),
}));

describe("VoteDelegationPanel", () => {
  beforeEach(() => {
    walletState.address = connectedAddress;
    walletState.isConnected = true;
    walletState.connect.mockReset();
    walletState.signTx.mockResolvedValue("signed-xdr");
    addToast.mockClear();
    updateToast.mockClear();
    getDelegationStatus.mockResolvedValue({
      delegatee: null,
      ownVotingPower: 1250,
      incomingDelegationPower: 750,
      incomingDelegatorCount: 1,
      controlledVotingPower: 2000,
    });
    resolveDelegateAddress.mockResolvedValue({ input: delegateAddress, address: delegateAddress });
    wouldCreateDelegationCycle.mockResolvedValue(false);
    delegateVotes.mockResolvedValue("delegate-hash");
    undelegateVotes.mockResolvedValue("undelegate-hash");
  });

  it("asks disconnected users to connect before managing delegation", () => {
    walletState.address = null;
    walletState.isConnected = false;

    render(<VoteDelegationPanel />);

    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(screen.getByText("Connect your wallet to manage vote delegation.")).toBeInTheDocument();
    expect(walletState.connect).toHaveBeenCalledOnce();
  });

  it("shows delegation status and controlled voting weight for a connected wallet", async () => {
    render(<VoteDelegationPanel />);

    expect(await screen.findByText("Not delegating")).toBeInTheDocument();
    expect(screen.getByText("1,250 ILN")).toBeInTheDocument();
    expect(screen.getByText("750 ILN")).toBeInTheDocument();
    expect(screen.getByText("2,000 ILN")).toBeInTheDocument();
    expect(screen.getByText("1 wallet delegates to you.")).toBeInTheDocument();
  });

  it("resolves a federation address and delegates votes through the transaction helper", async () => {
    resolveDelegateAddress.mockResolvedValue({
      input: "alice*example.com",
      address: delegateAddress,
      federationName: "alice*example.com",
    });

    render(<VoteDelegationPanel />);

    const input = screen.getByLabelText("Delegate address");
    fireEvent.change(input, { target: { value: "alice*example.com" } });
    fireEvent.blur(input);

    expect(await screen.findByText(/from alice\*example.com/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^delegate$/i }));

    await waitFor(() => expect(delegateVotes).toHaveBeenCalledWith(delegateAddress, connectedAddress, walletState.signTx));
    expect(updateToast).toHaveBeenCalledWith("toast-id", expect.objectContaining({ type: "success" }));
  });

  it("shows the required cycle warning before delegation", async () => {
    resolveDelegateAddress.mockResolvedValue({
      input: reverseDelegatorAddress,
      address: reverseDelegatorAddress,
    });
    wouldCreateDelegationCycle.mockResolvedValue(true);

    render(<VoteDelegationPanel />);

    const input = screen.getByLabelText("Delegate address");
    fireEvent.change(input, { target: { value: reverseDelegatorAddress } });
    fireEvent.blur(input);

    expect(
      await screen.findByText("You cannot delegate to an address that delegates back to you"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^delegate$/i })).toBeDisabled();
  });

  it("undelegates when a current delegatee is present", async () => {
    getDelegationStatus.mockResolvedValue({
      delegatee: delegateAddress,
      ownVotingPower: 1250,
      incomingDelegationPower: 0,
      incomingDelegatorCount: 0,
      controlledVotingPower: 1250,
    });

    render(<VoteDelegationPanel />);

    await screen.findByText(/You are delegating to/);
    fireEvent.click(screen.getByRole("button", { name: /undelegate/i }));

    await waitFor(() => expect(undelegateVotes).toHaveBeenCalledWith(connectedAddress, walletState.signTx));
  });
});
