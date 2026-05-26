import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DisputeInvoiceModal from "../DisputeInvoiceModal";
import type { Invoice } from "@/utils/soroban";

const invoice: Invoice = {
  id: 16n,
  freelancer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  payer: "GCSXPYZSTPKX2GDVW6XSJDBE3PVSNSXCCLTGSPJXNF57IJU5EDU6IUDV",
  amount: 1_000_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 300,
  status: "Funded",
};

describe("DisputeInvoiceModal", () => {
  it("shows the required evidence warning", () => {
    render(
      <DisputeInvoiceModal
        invoice={invoice}
        isSubmitting={false}
        onClose={vi.fn()}
        onDispute={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Your evidence description will be hashed and recorded on-chain. Save this text — you will need to share it with governance.",
      ),
    ).toBeInTheDocument();
  });

  it("requires evidence text", async () => {
    render(
      <DisputeInvoiceModal
        invoice={invoice}
        isSubmitting={false}
        onClose={vi.fn()}
        onDispute={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Raise Dispute" }));

    expect(await screen.findByText("Evidence description is required.")).toBeInTheDocument();
  });

  it("hashes evidence before submitting", async () => {
    const onDispute = vi.fn().mockResolvedValue(undefined);
    render(
      <DisputeInvoiceModal
        invoice={invoice}
        isSubmitting={false}
        onClose={vi.fn()}
        onDispute={onDispute}
      />,
    );

    fireEvent.change(screen.getByLabelText("Evidence description"), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Raise Dispute" }));

    await waitFor(() =>
      expect(onDispute).toHaveBeenCalledWith(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        "hello",
      ),
    );
  });
});
