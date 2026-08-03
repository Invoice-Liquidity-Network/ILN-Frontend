import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useContractEvents } from '../useContractEvents';

const mockConnectIndexerWebSocket = vi.fn();
const mockConnectHorizonTransactionStream = vi.fn();
const mockSetContractEventStreamingActive = vi.fn();
const mockApplyContractEventToInvoices = vi.fn();

// The hook connects to the indexer WebSocket first and only falls back to the
// Horizon transaction stream when that connection errors out.
vi.mock('@/lib/indexer-websocket', () => ({
  connectIndexerWebSocket: (...args: unknown[]) => mockConnectIndexerWebSocket(...args),
}));

vi.mock('@/lib/horizon-stream', () => ({
  connectHorizonTransactionStream: (...args: unknown[]) =>
    mockConnectHorizonTransactionStream(...args),
}));

vi.mock('@/lib/contract-event-stream-state', () => ({
  isContractEventStreamingActive: vi.fn(() => false),
  setContractEventStreamingActive: (...args: unknown[]) =>
    mockSetContractEventStreamingActive(...args),
}));

vi.mock('@/lib/contract-events', () => ({
  applyContractEventToInvoices: (...args: unknown[]) => mockApplyContractEventToInvoices(...args),
}));

// The client identity must be stable: the hook's connect effect depends on it,
// and a fresh object per render would re-run (and reset) the connection.
vi.mock('@tanstack/react-query', () => {
  const queryClient = {
    setQueryData: vi.fn((_key: unknown, updater: unknown) =>
      typeof updater === 'function' ? updater(undefined) : updater
    ),
    invalidateQueries: vi.fn(),
  };
  return { useQueryClient: () => queryClient };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockConnectIndexerWebSocket.mockReturnValue({ close: vi.fn() });
  mockConnectHorizonTransactionStream.mockReturnValue({ close: vi.fn() });
});

describe('useContractEvents', () => {
  it('connects to the indexer WebSocket when enabled', () => {
    renderHook(() => useContractEvents(true));

    expect(mockConnectIndexerWebSocket).toHaveBeenCalledWith(
      expect.objectContaining({
        onEvent: expect.any(Function),
        onStatusChange: expect.any(Function),
      })
    );
  });

  it('does not connect when disabled', () => {
    renderHook(() => useContractEvents(false));

    expect(mockConnectIndexerWebSocket).not.toHaveBeenCalled();
    expect(mockConnectHorizonTransactionStream).not.toHaveBeenCalled();
  });

  it('marks streaming active when the connection is established', () => {
    let statusCallback: ((status: string) => void) | null = null;
    mockConnectIndexerWebSocket.mockImplementation(({ onStatusChange }: any) => {
      statusCallback = onStatusChange;
      return { close: vi.fn() };
    });

    renderHook(() => useContractEvents(true));

    expect(statusCallback).not.toBeNull();
    act(() => statusCallback?.('connected'));
    expect(mockSetContractEventStreamingActive).toHaveBeenCalledWith(true);
  });

  it('falls back to the Horizon stream when the WebSocket disconnects', () => {
    let statusCallback: ((status: string) => void) | null = null;
    mockConnectIndexerWebSocket.mockImplementation(({ onStatusChange }: any) => {
      statusCallback = onStatusChange;
      return { close: vi.fn() };
    });

    const { result } = renderHook(() => useContractEvents(true));

    expect(statusCallback).not.toBeNull();
    act(() => statusCallback?.('disconnected'));

    expect(mockSetContractEventStreamingActive).toHaveBeenCalledWith(false);
    expect(mockConnectHorizonTransactionStream).toHaveBeenCalled();
    expect(result.current.connectionType).toBe('polling');
  });

  it('closes the connection and sets streaming inactive on cleanup', () => {
    const mockClose = vi.fn();
    mockConnectIndexerWebSocket.mockReturnValue({ close: mockClose });

    const { unmount } = renderHook(() => useContractEvents(true));

    unmount();

    expect(mockClose).toHaveBeenCalled();
    expect(mockSetContractEventStreamingActive).toHaveBeenCalledWith(false);
  });

  it('handles event callback when event is received', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockConnectIndexerWebSocket.mockImplementation(({ onEvent }: any) => {
      eventCallback = onEvent;
      return { close: vi.fn() };
    });

    renderHook(() => useContractEvents(true));

    act(() => eventCallback?.({ invoiceId: 'test-id', type: 'updated' }));

    expect(mockApplyContractEventToInvoices).toHaveBeenCalled();
  });

  it('reconnects when enabled prop changes from false to true', () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useContractEvents(enabled),
      {
        initialProps: { enabled: false },
      }
    );

    expect(mockConnectIndexerWebSocket).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(mockConnectIndexerWebSocket).toHaveBeenCalled();
  });
});
