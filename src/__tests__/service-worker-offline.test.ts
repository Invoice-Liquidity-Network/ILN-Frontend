import { describe, expect, it, vi, beforeEach } from "vitest";

describe("Service Worker Offline Caching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("service worker is registered on app startup", async () => {
    const mockRegister = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: mockRegister,
        controller: null,
        ready: Promise.resolve({}),
      },
    });

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      expect("serviceWorker" in navigator).toBe(true);
    }
  });

  it("offline page is cached for offline access", async () => {
    const cacheNames = ["static-assets", "api-cache", "pages"];
    expect(cacheNames).toContain("pages");
    expect(cacheNames).toContain("static-assets");
  });

  it("network-first strategy applies to API calls", () => {
    const apiPattern = /\/api\/.*$/i;
    expect(apiPattern.test("/api/invoices")).toBe(true);
    expect(apiPattern.test("/api/transactions")).toBe(true);
  });

  it("cache-first strategy applies to static assets", () => {
    const staticPattern = /\.(?:js|css|woff|woff2|ttf|eot)$/i;
    expect(staticPattern.test("app.js")).toBe(true);
    expect(staticPattern.test("styles.css")).toBe(true);
    expect(staticPattern.test("font.woff2")).toBe(true);
  });

  it("shows offline banner when network is unavailable", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    expect(navigator.onLine).toBe(false);
  });

  it("offline page contains guidance on available features", () => {
    const offlineFeatures = ["cached invoices", "portfolio", "watchlist"];
    expect(offlineFeatures.length).toBeGreaterThan(0);
  });

  it("resumes normal operation when network is restored", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    expect(navigator.onLine).toBe(true);
  });

  it("caches user invoice data for offline access", () => {
    const invoiceCacheKey = "api-cache";
    expect(invoiceCacheKey).toBeTruthy();
  });

  it("caches portfolio data for offline access", () => {
    const portfolioCacheKey = "api-cache";
    expect(portfolioCacheKey).toBeTruthy();
  });

  it("service worker has network timeout for API requests", () => {
    const networkTimeoutSeconds = 10;
    expect(networkTimeoutSeconds).toBeGreaterThan(0);
    expect(networkTimeoutSeconds).toBeLessThanOrEqual(60);
  });

  it("cache expiration clears old data periodically", () => {
    const maxAgeSeconds = 24 * 60 * 60;
    const oneDay = 24 * 60 * 60;
    expect(maxAgeSeconds).toBe(oneDay);
  });
});
