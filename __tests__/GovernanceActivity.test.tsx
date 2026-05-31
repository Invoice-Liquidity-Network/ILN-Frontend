import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GovernanceActivity from "@/components/GovernanceActivity";
import { fetchVotesForAddress } from "@/utils/governance";

vi.mock("@/utils/governance", () => ({
  fetchVotesForAddress: vi.fn(),
}));

const mockFetchVotesForAddress = vi.mocked(fetchVotesForAddress);

describe("GovernanceActivity Component", () => {
  it("renders loading state initially", () => {
    mockFetchVotesForAddress.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<GovernanceActivity address="GABC" />);
    expect(screen.getByRole("heading", { name: /Governance Activity/i })).toBeInTheDocument();
  });

  it("renders 'no activity' state when votes list is empty", async () => {
    mockFetchVotesForAddress.mockResolvedValue([]);
    render(<GovernanceActivity address="GABC" />);
    expect(await screen.findByText(/No governance activity yet/i)).toBeInTheDocument();
  });

  it("renders list of votes with correct columns when data is available", async () => {
    const mockVotes = [
      {
        proposalId: 1,
        proposalTitle: "Test Proposal Action",
        voter: "GABC",
        vote: "For" as const,
        weight: 1250,
        timestamp: 1710000000,
      },
    ];
    mockFetchVotesForAddress.mockResolvedValue(mockVotes);

    render(<GovernanceActivity address="GABC" />);

    expect(await screen.findByText(/Proposal ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Action/i)).toBeInTheDocument();
    expect(screen.getByText(/#1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Proposal Action/i)).toBeInTheDocument();
    expect(screen.getByText("For")).toBeInTheDocument();
    expect(screen.getByText("1,250 ILN")).toBeInTheDocument();
  });

  it("handles pagination when more than 10 votes", async () => {
    const mockVotes = Array.from({ length: 15 }).map((_, i) => ({
      proposalId: i + 1,
      proposalTitle: `Proposal Action ${i + 1}`,
      voter: "GABC",
      vote: "For" as const,
      weight: 1000,
      timestamp: 1710000000 + i * 3600,
    }));
    mockFetchVotesForAddress.mockResolvedValue(mockVotes);

    render(<GovernanceActivity address="GABC" />);

    expect(await screen.findByText(/#1/i)).toBeInTheDocument();
    expect(screen.getByText(/#10/i)).toBeInTheDocument();
    expect(screen.queryByText(/#11/i)).not.toBeInTheDocument();
    
    expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
  });
});
