import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SupportedTokensPage from "@/components/SupportedTokensPage";
import type { SupportedTokenInfo } from "@/utils/supportedTokens";

vi.mock("@/components/Navbar", () => ({
  default: () => <nav>Navbar</nav>,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("@/utils/supportedTokens", async () => {
  const actual = await vi.importActual<typeof import("@/utils/supportedTokens")>("@/utils/supportedTokens");
  return {
    ...actual,
    getFallbackSupportedTokens: vi.fn(),
    getSupportedTokens: vi.fn(),
  };
});

vi.mock("@/utils/trustline", () => ({
  addTokenTrustline: vi.fn(),
}));

const connect = vi.fn();
const signTx = vi.fn();
let walletState = {
  address: "",
  isConnected: false,
  connect,
  signTx,
};

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
}));

const addToast = vi.fn(() => "toast-id");
const updateToast = vi.fn();

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast }),
}));

import { getFallbackSupportedTokens, getSupportedTokens } from "@/utils/supportedTokens";
import { addTokenTrustline } from "@/utils/trustline";

const mockGetSupportedTokens = vi.mocked(getSupportedTokens);
const mockGetFallbackSupportedTokens = vi.mocked(getFallbackSupportedTokens);
const mockAddTokenTrustline = vi.mocked(addTokenTrustline);

const tokens: SupportedTokenInfo[] = [
  {
    contractId: "CUSDC",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 7,
    assetCode: "USDC",
    issuer: "GISSUERUSDC",
    issuerAddress: "GISSUERUSDC",
    protocolVolume: 12_500_000n,
    acquireUrl: "https://laboratory.stellar.org/",
    notes: ["Used as the default dollar-denominated invoice asset."],
    isNative: false,
    isLiveAllowlisted: true,
    canAddTrustline: true,
  },
  {
    contractId: "native:xlm",
    name: "Stellar Lumens",
    symbol: "XLM",
    decimals: 7,
    assetCode: "XLM",
    issuer: "Native Stellar asset",
    protocolVolume: 0n,
    acquireUrl: "https://laboratory.stellar.org/",
    notes: ["Native Stellar asset; no trustline is required.", "Amounts use 7 decimal places."],
    isNative: true,
    isLiveAllowlisted: true,
    canAddTrustline: false,
  },
];

describe("SupportedTokensPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletState = {
      address: "",
      isConnected: false,
      connect,
      signTx,
    };
    mockGetSupportedTokens.mockResolvedValue(tokens);
    mockGetFallbackSupportedTokens.mockReturnValue(tokens.map((token) => ({ ...token, isLiveAllowlisted: false })));
    mockAddTokenTrustline.mockResolvedValue({ hash: "txhash" });
  });

  it("renders token details without requiring a wallet connection", async () => {
    render(<SupportedTokensPage />);

    expect(await screen.findByRole("heading", { name: "Supported Tokens" })).toBeInTheDocument();
    expect(screen.getByText("USD Coin")).toBeInTheDocument();
    expect(screen.getAllByText("USDC").length).toBeGreaterThan(0);
    expect(screen.getByText("1.25 USDC")).toBeInTheDocument();
    expect(screen.getByText("Native Stellar asset; no trustline is required.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /native asset/i })).toBeDisabled();
  });

  it("connects the wallet before adding a trustline", async () => {
    render(<SupportedTokensPage />);

    fireEvent.click(await screen.findByRole("button", { name: /connect wallet/i }));

    expect(connect).toHaveBeenCalled();
    expect(mockAddTokenTrustline).not.toHaveBeenCalled();
  });

  it("adds a trustline when a connected wallet signs the transaction", async () => {
    walletState = {
      address: "GCONNECTED",
      isConnected: true,
      connect,
      signTx,
    };

    render(<SupportedTokensPage />);

    fireEvent.click(await screen.findByRole("button", { name: /add to wallet/i }));

    await waitFor(() => expect(mockAddTokenTrustline).toHaveBeenCalledWith(tokens[0], "GCONNECTED", signTx));
    expect(updateToast).toHaveBeenCalledWith(
      "toast-id",
      expect.objectContaining({
        type: "success",
        txHash: "txhash",
      })
    );
  });

  it("shows fallback token details when the live allowlist request fails", async () => {
    mockGetSupportedTokens.mockRejectedValue(new Error("RPC unavailable"));

    render(<SupportedTokensPage />);

    expect(await screen.findByText(/Live token allowlist unavailable: RPC unavailable/i)).toBeInTheDocument();
    expect(screen.getByText("Showing configured token details until the contract responds.")).toBeInTheDocument();
    expect(screen.getByText("USD Coin")).toBeInTheDocument();
  });
});
