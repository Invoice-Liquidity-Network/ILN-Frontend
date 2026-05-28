import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useNotificationEvents } from "../useNotificationEvents";
import type { Invoice } from "@/utils/soroban";

vi.mock("@/utils/governance", () => ({
  fetchProposals: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Test proposal",
      status: "Passed",
      description: "",
      type: "TextProposal",
      proposer: "G1",
      createdAt: 0,
      votingStartsAt: 0,
      votingEndsAt: 0,
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 0,
    },
  ]),
}));

vi.mock("@/utils/soroban", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/soroban")>();
  return {
    ...actual,
    getReputation: vi.fn().mockResolvedValue({ score: 80 }),
  };
});

describe("useNotificationEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInvoice: Invoice = {
    id: 9n,
    status: "Open",
    freelancer: "GFREELANCER",
    payer: "GPAYER",
    amount: 100n,
    due_date: 0n,
    discount_rate: 5,
    funder: "",
    funded_at: 0n,
    token: "CUSDC",
  };

  it("notifies freelancers when an invoice reaches a terminal state", async () => {
    const addNotification = vi.fn((n) => ({
      ...n,
      createdAt: new Date().toISOString(),
      read: false,
    }));

    const { rerender } = renderHook(
      ({ invoices }) =>
        useNotificationEvents({
          invoices,
          address: "GFREELANCER",
          addNotification,
        }),
      { initialProps: { invoices: [baseInvoice] } },
    );

    rerender({ invoices: [{ ...baseInvoice, status: "Paid" }] });

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "invoice",
          type: "settled",
        }),
      );
    });
  });
});
