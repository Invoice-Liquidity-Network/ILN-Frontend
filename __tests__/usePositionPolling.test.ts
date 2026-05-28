import { renderHook, waitFor } from "@testing-library/react";
import { usePositionPolling } from "@/hooks/usePositionPolling";
import type { Invoice } from "@/utils/soroban";
import type { ToastMessage } from "@/context/ToastContext";
import type { NotificationItem } from "@/context/NotificationContext";

describe("usePositionPolling", () => {
  const mockToast = jest.fn<string, [Omit<ToastMessage, "id">]>((toast) => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  });

  const mockNotification = jest.fn<NotificationItem, [Omit<NotificationItem, "createdAt" | "read">]>((notification) => {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };
  });

  const baseInvoice: Invoice = {
    id: 1n,
    status: "Funded",
    freelancer: "GFREELANCER1",
    payer: "GPAYER1",
    amount: 1_000_000n, // 1 USDC
    due_date: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    discount_rate: 5, // 5% = 50000 basis points
    funder: "GFUNDER1",
    funded_at: Math.floor(Date.now() / 1000),
    token: "CUSDC",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should notify on Funded → Paid transition", () => {
    const invoices = [{ ...baseInvoice, status: "Funded" }];

    const { rerender } = renderHook(
      ({ invoices: inv, address, addToast, addNotification }) =>
        usePositionPolling({ invoices: inv, address, addToast, addNotification }),
      {
        initialProps: {
          invoices,
          address: "GFUNDER1",
          addToast: mockToast,
          addNotification: mockNotification,
        },
      },
    );

    expect(mockToast).not.toHaveBeenCalled();
    expect(mockNotification).not.toHaveBeenCalled();

    // Simulate invoice state change to "Paid"
    const updatedInvoices = [{ ...baseInvoice, status: "Paid" }];
    rerender({
      invoices: updatedInvoices,
      address: "GFUNDER1",
      addToast: mockToast,
      addNotification: mockNotification,
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: expect.stringContaining("paid"),
      }),
    );
    expect(mockNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "settled",
        title: expect.stringContaining("paid"),
      }),
    );
  });

  it("should notify on Funded → Defaulted transition", () => {
    const invoices = [{ ...baseInvoice, status: "Funded" }];

    const { rerender } = renderHook(
      ({ invoices: inv, address, addToast, addNotification }) =>
        usePositionPolling({ invoices: inv, address, addToast, addNotification }),
      {
        initialProps: {
          invoices,
          address: "GFUNDER1",
          addToast: mockToast,
          addNotification: mockNotification,
        },
      },
    );

    const updatedInvoices = [{ ...baseInvoice, status: "Defaulted" }];
    rerender({
      invoices: updatedInvoices,
      address: "GFUNDER1",
      addToast: mockToast,
      addNotification: mockNotification,
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: expect.stringContaining("expired"),
      }),
    );
    expect(mockNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "expired",
        title: expect.stringContaining("expired"),
      }),
    );
  });

  it("should notify on Funded → Cancelled transition (disputed)", () => {
    const invoices = [{ ...baseInvoice, status: "Funded" }];

    const { rerender } = renderHook(
      ({ invoices: inv, address, addToast, addNotification }) =>
        usePositionPolling({ invoices: inv, address, addToast, addNotification }),
      {
        initialProps: {
          invoices,
          address: "GFUNDER1",
          addToast: mockToast,
          addNotification: mockNotification,
        },
      },
    );

    const updatedInvoices = [{ ...baseInvoice, status: "Cancelled" }];
    rerender({
      invoices: updatedInvoices,
      address: "GFUNDER1",
      addToast: mockToast,
      addNotification: mockNotification,
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: expect.stringContaining("disputed"),
      }),
    );
    expect(mockNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "disputed",
        title: expect.stringContaining("disputed"),
      }),
    );
  });

  it("should notify once when invoice expires (due date passed)", () => {
    const pastDue = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const invoices = [{ ...baseInvoice, due_date: pastDue, status: "Funded" }];

    renderHook(
      ({ invoices: inv, address, addToast, addNotification }) =>
        usePositionPolling({ invoices: inv, address, addToast, addNotification }),
      {
        initialProps: {
          invoices,
          address: "GFUNDER1",
          addToast: mockToast,
          addNotification: mockNotification,
        },
      },
    );

    // Simulate polling interval
    jest.runOnlyPendingTimers();

    // Should have called once for due date expiry
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockNotification).toHaveBeenCalledTimes(1);
  });

  it("should not notify for invoices not funded by the current address", () => {
    const invoices = [{ ...baseInvoice, status: "Funded", funder: "GOTHER_FUNDER" }];

    renderHook(
      ({ invoices: inv, address, addToast, addNotification }) =>
        usePositionPolling({ invoices: inv, address, addToast, addNotification }),
      {
        initialProps: {
          invoices,
          address: "GFUNDER1",
          addToast: mockToast,
          addNotification: mockNotification,
        },
      },
    );

    expect(mockToast).not.toHaveBeenCalled();
    expect(mockNotification).not.toHaveBeenCalled();
  });

  it("should not notify when address is null", () => {
    const invoices = [baseInvoice];

    renderHook(
      ({ invoices: inv, address, addToast, addNotification }) =>
        usePositionPolling({ invoices: inv, address, addToast, addNotification }),
      {
        initialProps: {
          invoices,
          address: null,
          addToast: mockToast,
          addNotification: mockNotification,
        },
      },
    );

    expect(mockToast).not.toHaveBeenCalled();
    expect(mockNotification).not.toHaveBeenCalled();
  });
});
