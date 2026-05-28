"use client";

/**
 * Minimal analytics bridge. Emits a DOM CustomEvent so any sink (or a test) can
 * observe product events without the app taking a hard dependency on a specific
 * analytics provider. Used to record wallet connections (#1).
 */
export const ANALYTICS_EVENT = "iln:analytics";

export interface AnalyticsPayload {
  name: string;
  props?: Record<string, unknown>;
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AnalyticsPayload>(ANALYTICS_EVENT, { detail: { name, props } }),
  );
}
