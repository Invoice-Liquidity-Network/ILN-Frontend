import { beforeEach, describe, expect, it } from "vitest";
import {
  clearWalletStorage,
  WALLET_ADDRESS_STORAGE_KEY,
} from "../walletStorage";

describe("clearWalletStorage (#4)", () => {
  beforeEach(() => localStorage.clear());

  it("removes the stored address and wallet-scoped caches", () => {
    localStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, "GTEST");
    localStorage.setItem("iln-address-book-GTEST", "[]");
    localStorage.setItem("iln-referral-7", "CODE");
    localStorage.setItem("iln-watchlist", "[]");
    localStorage.setItem("freelancerInvoices.statuses", "Paid");

    clearWalletStorage();

    expect(localStorage.getItem(WALLET_ADDRESS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("iln-address-book-GTEST")).toBeNull();
    expect(localStorage.getItem("iln-referral-7")).toBeNull();
    expect(localStorage.getItem("iln-watchlist")).toBeNull();
    expect(localStorage.getItem("freelancerInvoices.statuses")).toBeNull();
  });

  it("leaves unrelated keys untouched", () => {
    localStorage.setItem("theme", "dark");
    localStorage.setItem("iln_wallet_address", "GTEST");

    clearWalletStorage();

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("iln_wallet_address")).toBeNull();
  });
});
