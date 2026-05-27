import { describe, expect, it, vi } from "vitest";
import { trackEvent, ANALYTICS_EVENT, type AnalyticsPayload } from "../analytics";

describe("trackEvent (#1)", () => {
  it("dispatches an analytics CustomEvent with name and props", () => {
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_EVENT, listener as EventListener);

    trackEvent("wallet_connected", { provider: "freighter" });

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = (listener.mock.calls[0][0] as CustomEvent<AnalyticsPayload>).detail;
    expect(detail.name).toBe("wallet_connected");
    expect(detail.props).toEqual({ provider: "freighter" });

    window.removeEventListener(ANALYTICS_EVENT, listener as EventListener);
  });
});
