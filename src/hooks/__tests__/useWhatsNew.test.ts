import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useWhatsNew } from "../useWhatsNew";

const WHATS_NEW_VERSION_KEY = "iln:last-seen-version";
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || "dev";

describe("useWhatsNew", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("does not open for first-time visitors and saves the current version", () => {
    expect(localStorage.getItem(WHATS_NEW_VERSION_KEY)).toBeNull();

    const { result } = renderHook(() => useWhatsNew());

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem(WHATS_NEW_VERSION_KEY)).toBe(CURRENT_VERSION);
  });

  it("does not open for returning users on the same version", () => {
    localStorage.setItem(WHATS_NEW_VERSION_KEY, CURRENT_VERSION);

    const { result } = renderHook(() => useWhatsNew());

    expect(result.current.isOpen).toBe(false);
  });

  it("opens for returning users on a new version", () => {
    localStorage.setItem(WHATS_NEW_VERSION_KEY, "v0.9.0"); // Old version

    const { result } = renderHook(() => useWhatsNew());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.items.length).toBeLessThanOrEqual(5); // Maximum 5 items
  });

  it("dismisses the modal and updates stored version", () => {
    localStorage.setItem(WHATS_NEW_VERSION_KEY, "v0.9.0");

    const { result } = renderHook(() => useWhatsNew());
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem(WHATS_NEW_VERSION_KEY)).toBe(CURRENT_VERSION);
  });
});
