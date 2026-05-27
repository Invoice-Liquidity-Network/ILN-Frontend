import { vi, describe, test, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTransaction } from "../useTransaction";

const addToast = vi.fn(() => "toast-1");
const updateToast = vi.fn();
const signTxMock = vi.fn();

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast }),
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    isConnected: true,
    address: "GABCDE12345",
    signTx: signTxMock,
  }),
}));

vi.mock("@/utils/soroban", () => ({
  submitSignedTransaction: vi.fn(async () => ({ txHash: "tx-hash" })),
}));

describe("useTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("executes a transaction and updates toast to success", async () => {
    signTxMock.mockResolvedValue("signed-xdr");

    const { result } = renderHook(() => useTransaction());
    let executePromise: Promise<unknown> | null = null;

    act(() => {
      executePromise = result.current.execute(
        async (signTx) => {
          const signed = await signTx("tx-xdr");
          expect(result.current.isSigning).toBe(true);
          return `result:${signed}`;
        },
        "Submitting transaction"
      );
    });

    await waitFor(() => expect(result.current.isSigning).toBe(true));
    await act(async () => {
      await executePromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.success).toBe(true);
    expect(result.current.isSigning).toBe(false);
    expect(addToast).toHaveBeenCalledWith({
      type: "pending",
      title: "Submitting transaction",
      message: "Waiting for wallet signature...",
    });
    expect(updateToast).toHaveBeenCalledWith("toast-1", expect.objectContaining({
      type: "success",
      title: "Transaction complete",
      message: "Your transaction was confirmed.",
    }));
    expect(await executePromise).toBe("result:signed-xdr");
  });

  test("handles wallet rejection and sets error state", async () => {
    signTxMock.mockRejectedValue(new Error("User rejected the transaction"));

    const { result } = renderHook(() => useTransaction());

    await act(async () => {
      const response = await result.current.execute(async (signTx) => await signTx("tx-xdr"));
      expect(response).toBeNull();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Transaction cancelled");
    expect(updateToast).toHaveBeenCalledWith("toast-1", expect.objectContaining({
      type: "error",
      title: "Transaction cancelled",
      message: "Transaction cancelled",
      action: undefined,
    }));
  });

  test("exposes a retry action for non-rejection failures", async () => {
    signTxMock.mockRejectedValueOnce(new Error("Network failure"));
    signTxMock.mockResolvedValueOnce("signed-xdr");

    const { result } = renderHook(() => useTransaction());

    await act(async () => {
      const response = await result.current.execute(async (signTx) => await signTx("tx-xdr"));
      expect(response).toBeNull();
    });

    const errorToast = updateToast.mock.calls.find(([_id, payload]) => payload.type === "error");
    expect(errorToast).toBeDefined();

    const action = errorToast?.[1].action as { label: string; onClick: () => Promise<void> } | undefined;
    expect(action).toBeDefined();
    expect(action?.label).toBe("Retry");

    await act(async () => {
      await action?.onClick();
    });

    expect(addToast).toHaveBeenCalledTimes(2);
    expect(updateToast).toHaveBeenCalledWith("toast-1", expect.objectContaining({ type: "success" }));
  });
});
