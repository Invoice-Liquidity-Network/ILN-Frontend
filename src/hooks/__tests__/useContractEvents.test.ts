import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useContractEvents } from "../useContractEvents";

const mockConnectHorizonTransactionStream = vi.fn();
const mockSetContractEventStreamingActive = vi.fn();
const mockApplyContractEventToInvoices = vi.fn();

vi.mock("@/lib/horizon-stream", () => ({
  connectHorizonTransactionStream: (...args: unknown[]) => mockConnectHorizonTransactionStream(...args),
}));

vi.mock("@/lib/contract-event-stream-state", () => ({
  isContractEventStreamingActive: vi.fn(() => false),
  setContractEventStreamingActive: (...args: unknown[]) => mockSetContractEventStreamingActive(...args),
}));

vi.mock("@/lib/contract-events", () => ({
  applyContractEventToInvoices: (...args: unknown[]) => mockApplyContractEventToInvoices(...args),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useContractEvents", () => {
  it("connects to Horizon transaction stream when enabled", () => {
    mockConnectHorizonTransactionStream.mockReturnValue({
      close: vi.fn(),
    });

    renderHook(() => useContractEvents(true));

    expect(mockConnectHorizonTransactionStream).toHaveBeenCalledWith(
      expect.objectContaining({
        onEvent: expect.any(Function),
        onStatusChange: expect.any(Function),
      })
    );
  });

  it("does not connect to Horizon when disabled", () => {
    renderHook(() => useContractEvents(false));

    expect(mockConnectHorizonTransactionStream).not.toHaveBeenCalled();
  });

  it("calls onStatusChange with connected when connection established", () => {
    let statusCallback: ((status: string) => void) | null = null;
    mockConnectHorizonTransactionStream.mockImplementation(({ onStatusChange }: any) => {
      statusCallback = onStatusChange;
      return { close: vi.fn() };
    });

    renderHook(() => useContractEvents(true));

    expect(statusCallback).not.toBeNull();
    statusCallback?.("connected");
    expect(mockSetContractEventStreamingActive).toHaveBeenCalledWith(true);
  });

  it("calls onStatusChange with disconnected when connection lost", () => {
    let statusCallback: ((status: string) => void) | null = null;
    mockConnectHorizonTransactionStream.mockImplementation(({ onStatusChange }: any) => {
      statusCallback = onStatusChange;
      return { close: vi.fn() };
    });

    renderHook(() => useContractEvents(true));

    expect(statusCallback).not.toBeNull();
    statusCallback?.("disconnected");
    expect(mockSetContractEventStreamingActive).toHaveBeenCalledWith(false);
  });

  it("closes Horizon connection and sets streaming inactive on cleanup", () => {
    const mockClose = vi.fn();
    mockConnectHorizonTransactionStream.mockReturnValue({
      close: mockClose,
    });

    const { unmount } = renderHook(() => useContractEvents(true));

    unmount();

    expect(mockClose).toHaveBeenCalled();
    expect(mockSetContractEventStreamingActive).toHaveBeenCalledWith(false);
  });

  it("handles event callback when event is received", () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockConnectHorizonTransactionStream.mockImplementation(({ onEvent }: any) => {
      eventCallback = onEvent;
      return { close: vi.fn() };
    });

    renderHook(() => useContractEvents(true));

    const testEvent = { invoiceId: "test-id", type: "updated" };
    eventCallback?.(testEvent);

    expect(mockApplyContractEventToInvoices).toHaveBeenCalled();
  });

  it("reconnects when enabled prop changes from false to true", () => {
    mockConnectHorizonTransactionStream.mockReturnValue({
      close: vi.fn(),
    });

    const { rerender } = renderHook(({ enabled }: { enabled: boolean }) => useContractEvents(enabled), {
      initialProps: { enabled: false },
    });

    expect(mockConnectHorizonTransactionStream).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(mockConnectHorizonTransactionStream).toHaveBeenCalled();
  });
});
