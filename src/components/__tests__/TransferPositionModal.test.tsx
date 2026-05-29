import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TransferPositionModal from "../TransferPositionModal";
import type { Invoice } from "@/utils/soroban";

const CURRENT_LP = "GCSXPYZSTPKX2GDVW6XSJDBE3PVSNSXCCLTGSPJXNF57IJU5EDU6IUDV";
const NEW_LP = "GDIEC472DEK3S5UWVKYDBXG74R53KMHGXGFIURLJUF6P6JJ352HLLJED";

const invoice: Invoice = {
  id: 27n,
  freelancer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  payer: "GCBXRCREFHR6YEJ4VFRGRLRACPGWSZUKRIKG3ZNGV5DGYIUEE2GTWYNO",
  amount: 1_000_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 500,
  status: "Funded",
  funder: CURRENT_LP,
};

function renderModal(onTransfer = vi.fn()) {
  render(
    <TransferPositionModal
      invoice={invoice}
      currentLpAddress={CURRENT_LP}
      isTransferring={false}
      onClose={vi.fn()}
      onTransfer={onTransfer}
    />,
  );
}

describe("TransferPositionModal", () => {
  it("shows the payout warning", () => {
    renderModal();

    expect(
      screen.getByText("After transfer, all future payouts for this invoice go to the new address."),
    ).toBeInTheDocument();
  });

  it("rejects invalid Stellar addresses", () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("New LP address"), {
      target: { value: "not-a-stellar-address" },
    });

    expect(screen.getByText("Enter a valid Stellar G-address.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Transfer Position" })).toBeDisabled();
  });

  it("rejects the current LP address", () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("New LP address"), {
      target: { value: CURRENT_LP },
    });

    expect(
      screen.getByText("New LP address must be different from the current LP."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Transfer Position" })).toBeDisabled();
  });

  it("submits a valid new LP address", async () => {
    const onTransfer = vi.fn().mockResolvedValue(undefined);
    renderModal(onTransfer);

    fireEvent.change(screen.getByLabelText("New LP address"), {
      target: { value: ` ${NEW_LP} ` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Transfer Position" }));

    await waitFor(() => expect(onTransfer).toHaveBeenCalledWith(NEW_LP));
  });
});
