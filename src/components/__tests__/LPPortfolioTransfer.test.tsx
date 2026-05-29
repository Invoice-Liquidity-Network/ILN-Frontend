import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LPPortfolio from "../LPPortfolio";
import type { Invoice } from "@/utils/soroban";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const fundedInvoice: Invoice = {
  id: 12n,
  freelancer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  payer: "GDIEC472DEK3S5UWVKYDBXG74R53KMHGXGFIURLJUF6P6JJ352HLLJED",
  amount: 500_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 400,
  status: "Funded",
  funder: "GCSXPYZSTPKX2GDVW6XSJDBE3PVSNSXCCLTGSPJXNF57IJU5EDU6IUDV",
};

describe("LPPortfolio transfer action", () => {
  it("renders Transfer Position for funded invoices and calls the handler", async () => {
    const onTransferPosition = vi.fn();

    render(
      <LPPortfolio
        invoices={[fundedInvoice]}
        isLoading={false}
        onClaimDefault={vi.fn()}
        claimingInvoiceId={null}
        onTransferPosition={onTransferPosition}
      />,
    );

    const button = await screen.findByRole("button", { name: "Transfer Position" });
    fireEvent.click(button);

    await waitFor(() => expect(onTransferPosition).toHaveBeenCalledWith(fundedInvoice));
  });
});
