import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvoiceDetailPage from "../page";
import { getInvoice, type Invoice } from "@/utils/soroban";

vi.mock("@/components/ActivityFeed", () => ({
  default: () => <div>Activity feed</div>,
}));

vi.mock("@/components/ChangeInvoiceTokenModal", () => ({
  default: ({ onSuccess }: { onSuccess: (token: string) => void }) => (
    <div role="dialog" aria-label="Change Token">
      <button onClick={() => onSuccess("CEURC")}>Mock change token success</button>
    </div>
  ),
}));

const connect = vi.fn();
let walletState = {
  address: "",
  connect,
};

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("@/hooks/useApprovedTokens", () => ({
  useApprovedTokens: () => ({
    tokens: [
      { contractId: "CUSDC", name: "USD Coin", symbol: "USDC", decimals: 7, iconLabel: "US" },
      { contractId: "CEURC", name: "Euro Coin", symbol: "EURC", decimals: 7, iconLabel: "EU" },
    ],
    tokenMap: new Map([
      ["CUSDC", { contractId: "CUSDC", name: "USD Coin", symbol: "USDC", decimals: 7, iconLabel: "US" }],
      ["CEURC", { contractId: "CEURC", name: "Euro Coin", symbol: "EURC", decimals: 7, iconLabel: "EU" }],
    ]),
    defaultToken: { contractId: "CUSDC", name: "USD Coin", symbol: "USDC", decimals: 7, iconLabel: "US" },
  }),
}));

vi.mock("@/utils/soroban", async () => {
  const actual = await vi.importActual<typeof import("@/utils/soroban")>("@/utils/soroban");
  return {
    ...actual,
    getInvoice: vi.fn(),
  };
});

const invoice: Invoice = {
  id: 9n,
  status: "Pending",
  freelancer: "GFREELANCER",
  payer: "GPAYER",
  amount: 10_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 300,
  token: "CUSDC",
};

function params(id = "9") {
  const value = Promise.resolve({ id }) as Promise<{ id: string }> & { _resolvedValue?: { id: string } };
  value._resolvedValue = { id };
  return value;
}

describe("InvoiceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletState = {
      address: "GFREELANCER",
      connect,
    };
    vi.mocked(getInvoice).mockResolvedValue(invoice);
  });

  it("shows Change Token only for the submitting freelancer while pending", async () => {
    render(<InvoiceDetailPage params={params()} />);

    expect(await screen.findByRole("heading", { name: "Invoice #9" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change Token" })).toBeInTheDocument();
  });

  it("does not show Change Token for non-submitters", async () => {
    walletState = {
      address: "GOTHER",
      connect,
    };

    render(<InvoiceDetailPage params={params()} />);

    expect(await screen.findByRole("heading", { name: "Invoice #9" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change Token" })).not.toBeInTheDocument();
    expect(screen.getByText("Only the submitting freelancer can change the invoice token before funding.")).toBeInTheDocument();
  });

  it("does not show Change Token after the invoice leaves Pending", async () => {
    vi.mocked(getInvoice).mockResolvedValue({ ...invoice, status: "Funded" });

    render(<InvoiceDetailPage params={params()} />);

    expect(await screen.findByRole("heading", { name: "Invoice #9" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change Token" })).not.toBeInTheDocument();
  });

  it("updates the visible token immediately after a successful modal change", async () => {
    render(<InvoiceDetailPage params={params()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Change Token" }));
    fireEvent.click(screen.getByText("Mock change token success"));

    await waitFor(() => expect(screen.getByText("EURC")).toBeInTheDocument());
  });
});
