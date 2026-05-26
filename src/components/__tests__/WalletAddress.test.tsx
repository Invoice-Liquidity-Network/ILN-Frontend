import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WalletAddress, { clearWalletAddressCacheForTests } from "../WalletAddress";
import { resolveFederationAddress } from "@/utils/federation";

vi.mock("@/utils/federation", () => ({
  resolveFederationAddress: vi.fn(),
}));

const ADDRESS = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6";

describe("WalletAddress", () => {
  beforeEach(() => {
    clearWalletAddressCacheForTests();
    vi.mocked(resolveFederationAddress).mockReset();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows a skeleton while resolving", () => {
    vi.mocked(resolveFederationAddress).mockReturnValue(new Promise(() => {}));

    render(<WalletAddress address={ADDRESS} />);

    expect(screen.getByLabelText("Resolving wallet address")).toBeInTheDocument();
  });

  it("displays the resolved Stellar Federation address", async () => {
    vi.mocked(resolveFederationAddress).mockResolvedValue("alice*iln.finance");

    render(<WalletAddress address={ADDRESS} />);

    expect(await screen.findByText("alice*iln.finance")).toBeInTheDocument();
  });

  it("falls back to a truncated G-address when resolution fails", async () => {
    vi.mocked(resolveFederationAddress).mockResolvedValue(null);

    render(<WalletAddress address={ADDRESS} />);

    expect(await screen.findByText("GCCCCC...CCC6")).toBeInTheDocument();
  });

  it("copies the underlying G-address", async () => {
    vi.mocked(resolveFederationAddress).mockResolvedValue("alice*iln.finance");

    render(<WalletAddress address={ADDRESS} />);
    await screen.findByText("alice*iln.finance");
    fireEvent.click(screen.getByRole("button", { name: "Copy wallet address" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(ADDRESS);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Wallet address copied" })).toBeInTheDocument();
    });
  });

  it("caches resolved addresses for the session", async () => {
    vi.mocked(resolveFederationAddress).mockResolvedValue("alice*iln.finance");
    const { unmount } = render(<WalletAddress address={ADDRESS} />);
    expect(await screen.findByText("alice*iln.finance")).toBeInTheDocument();
    unmount();

    render(<WalletAddress address={ADDRESS} />);

    expect(screen.getByText("alice*iln.finance")).toBeInTheDocument();
    expect(resolveFederationAddress).toHaveBeenCalledTimes(1);
  });
});
