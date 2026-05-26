import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TransactionModal from "../TransactionModal";

describe("TransactionModal", () => {
  it("shows the signing prompt while a transaction is waiting on the wallet", () => {
    render(<TransactionModal phase="signing" />);

    expect(screen.getByText("Waiting for wallet signature...")).toBeInTheDocument();
    expect(screen.getByText("Confirm the request in your Stellar wallet to continue.")).toBeInTheDocument();
  });

  it("stays hidden outside active signing states", () => {
    const { container } = render(<TransactionModal phase="idle" />);

    expect(container).toBeEmptyDOMElement();
  });
});
