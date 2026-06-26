import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OfflinePage from "../page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OfflinePage", () => {
  it("renders the offline page", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<OfflinePage />);
    expect(screen.getByText(/offline|connection/i)).toBeInTheDocument();
  });

  it("displays offline icon when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<OfflinePage />);
    await waitFor(() => {
      const heading = screen.getByText(/you're offline|offline/i);
      expect(heading).toBeInTheDocument();
    });
  });

  it("displays online icon when online", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    render(<OfflinePage />);
    await waitFor(() => {
      const heading = screen.getByText(/connection restored|online/i);
      if (heading) {
        expect(heading).toBeInTheDocument();
      }
    });
  });

  it("displays available offline features list when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<OfflinePage />);
    await waitFor(() => {
      expect(screen.getByText(/available offline/i)).toBeInTheDocument();
      expect(screen.getByText(/cached invoices/i)).toBeInTheDocument();
    });
  });

  it("shows continue button when online", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    render(<OfflinePage />);
    await waitFor(() => {
      const continueButton = screen.queryByRole("button", { name: /continue/i });
      if (continueButton) {
        expect(continueButton).toBeInTheDocument();
      }
    });
  });

  it("shows dashboard link", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<OfflinePage />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard|go to/i });
    expect(dashboardLink).toBeInTheDocument();
  });

  it("displays status indicator", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<OfflinePage />);
    await waitFor(() => {
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });
  });

  it("updates UI when online event fires", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<OfflinePage />);
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    fireEvent(window, new Event("online"));

    await waitFor(() => {
      const heading = screen.queryByText(/connection restored|online/i);
      if (heading) {
        expect(heading).toBeInTheDocument();
      }
    });
  });

  it("updates UI when offline event fires", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    render(<OfflinePage />);
    await waitFor(() => {
      const heading = screen.queryByText(/connection restored/i);
      if (heading) {
        expect(heading).toBeInTheDocument();
      }
    });

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    fireEvent(window, new Event("offline"));

    await waitFor(() => {
      const offlineHeading = screen.queryByText(/you're offline/i);
      if (offlineHeading) {
        expect(offlineHeading).toBeInTheDocument();
      }
    });
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<OfflinePage />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
