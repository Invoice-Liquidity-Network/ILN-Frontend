import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminHealthDashboard from "@/app/admin/page";

const adminAddress = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const walletState = {
  address: adminAddress as string | null,
  signTx: vi.fn(),
};

const mockHealth = {
  paused: false,
  disputedInvoices: [
    {
      id: 1n,
      status: "Disputed",
      freelancer: "GFREELANCER",
      payer: "GPAYER",
      amount: 100n,
      due_date: 1n,
      discount_rate: 100,
    },
  ],
  pendingProposals: [
    {
      id: 7,
      title: "Update parameter",
      description: "Update a protocol parameter.",
      type: "ParameterUpdate",
      status: "Active",
      proposer: "GPROPOSER",
      createdAt: 1,
      votingStartsAt: 1,
      votingEndsAt: 2,
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 10,
    },
  ],
  readyProposals: [
    {
      id: 3,
      title: "Ready proposal",
      description: "Ready to execute.",
      type: "ProtocolUpgrade",
      status: "Passed",
      proposer: "GPROPOSER",
      createdAt: 1,
      votingStartsAt: 1,
      votingEndsAt: 2,
      executableAfter: 3,
      votesFor: 10,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 10,
    },
  ],
  oracleLastUpdatedAt: Math.floor(Date.now() / 1000) - 600,
  contractVersion: "testnet:CD3TE3IA",
  upgradeWindowStartsAt: Math.floor(Date.now() / 1000) + 3 * 86_400,
  treasuryBalanceXlm: 123.45,
};

const fetchProtocolHealth = vi.fn();
const setProtocolPaused = vi.fn();
const executeReadyProposals = vi.fn();

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("@/hooks/useDocumentTitle", () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <nav data-testid="navbar" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock("@/utils/admin-health", () => ({
  fetchProtocolHealth: () => fetchProtocolHealth(),
  setProtocolPaused: (...args: unknown[]) => setProtocolPaused(...args),
  executeReadyProposals: (...args: unknown[]) => executeReadyProposals(...args),
  isAdminAddress: (address: string | null | undefined) => address === adminAddress,
}));

describe("AdminHealthDashboard", () => {
  beforeEach(() => {
    walletState.address = adminAddress;
    walletState.signTx.mockReset();
    fetchProtocolHealth.mockReset();
    fetchProtocolHealth.mockResolvedValue(mockHealth);
    setProtocolPaused.mockReset();
    setProtocolPaused.mockResolvedValue({ txHash: "abc", paused: true });
    executeReadyProposals.mockReset();
    executeReadyProposals.mockResolvedValue(["tx"]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders a 403 state for non-admin wallets", () => {
    walletState.address = "GNOTADMIN";
    render(<AdminHealthDashboard />);
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.getByText(/Admin access required/i)).toBeInTheDocument();
    expect(fetchProtocolHealth).not.toHaveBeenCalled();
  });

  it("renders protocol health panels for the admin wallet", async () => {
    render(<AdminHealthDashboard />);
    expect(await screen.findByText("Protocol Health")).toBeInTheDocument();
    expect(screen.getByText("Protocol Status")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Open Disputes")).toBeInTheDocument();
    expect(screen.getByText("Pending Governance Proposals")).toBeInTheDocument();
    expect(screen.getByText("Oracle Last Updated")).toBeInTheDocument();
    expect(screen.getByText("Contract Version")).toBeInTheDocument();
    expect(screen.getByText("Treasury Balance")).toBeInTheDocument();
  });

  it("requires confirmation before pausing the protocol", async () => {
    const user = userEvent.setup();
    render(<AdminHealthDashboard />);
    await user.click(await screen.findByRole("button", { name: "Pause" }));
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(setProtocolPaused).toHaveBeenCalledWith(true, adminAddress, walletState.signTx);
    });
  });

  it("does not call admin actions when confirmation is rejected", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = userEvent.setup();
    render(<AdminHealthDashboard />);
    await user.click(await screen.findByRole("button", { name: "Pause" }));
    expect(setProtocolPaused).not.toHaveBeenCalled();
  });
});
