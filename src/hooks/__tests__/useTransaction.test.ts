import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTransaction } from "../useTransaction";

const addToast = vi.fn();
const updateToast = vi.fn();

vi.mock("../../context/ToastContext", () => ({
  useToast: () => ({ addToast, updateToast }),
}));

describe("useTransaction", () => {
  beforeEach(() => {
    addToast.mockReset();
    updateToast.mockReset();
    addToast.mockReturnValue("toast-1");
  });

  it("moves through signing and success states", async () => {
    const { result } = renderHook(() => useTransaction());
    const operation = vi.fn(async ({ setSigning }) => {
      setSigning();
      return { txHash: "abc" };
    });
    const onSuccess = vi.fn();

    await act(async () => {
      await result.current.execute(operation, {
        successTitle: "Done",
        successMessage: "Confirmed",
        onSuccess,
      });
    });

    expect(operation).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith({ txHash: "abc" });
    expect(result.current.state.phase).toBe("success");
    expect(updateToast).toHaveBeenCalledWith(
      "toast-1",
      expect.objectContaining({ type: "success", title: "Done", message: "Confirmed" }),
    );
  });

  it("normalizes wallet rejection errors as transaction cancellations", async () => {
    const { result } = renderHook(() => useTransaction());

    await act(async () => {
      await result.current.execute(async ({ setSigning }) => {
        setSigning();
        throw new Error("User rejected the request");
      });
    });

    expect(result.current.state).toEqual({
      phase: "error",
      error: "Transaction cancelled",
    });
    expect(updateToast).toHaveBeenCalledWith(
      "toast-1",
      expect.objectContaining({
        type: "error",
        title: "Transaction cancelled",
        actionLabel: undefined,
      }),
    );
  });

  it("adds a retry action for network errors", async () => {
    const { result } = renderHook(() => useTransaction());
    const operation = vi.fn(async () => {
      throw new Error("RPC timeout");
    });

    await act(async () => {
      await result.current.execute(operation, { errorTitle: "Network error" });
    });

    const errorToast = updateToast.mock.calls.at(-1)?.[1];
    expect(errorToast).toEqual(
      expect.objectContaining({
        type: "error",
        title: "Network error",
        message: "RPC timeout",
        actionLabel: "Retry",
      }),
    );

    await act(async () => {
      errorToast.onAction();
    });

    await waitFor(() => expect(operation).toHaveBeenCalledTimes(2));
  });
});
