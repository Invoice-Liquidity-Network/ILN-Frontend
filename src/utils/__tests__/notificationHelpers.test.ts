import { describe, expect, it } from "vitest";
import {
  formatTimeAgo,
  getNotificationIcon,
  MAX_NOTIFICATIONS,
} from "../notificationHelpers";

describe("notificationHelpers", () => {
  it("formats recent timestamps as time ago", () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(recent)).toBe("5m ago");
  });

  it("returns category-specific icons", () => {
    expect(getNotificationIcon("governance", "proposal")).toBe("how_to_vote");
    expect(getNotificationIcon("reputation", "reputation")).toBe("military_tech");
    expect(getNotificationIcon("invoice", "settled")).toBe("paid");
  });

  it("caps notifications at 50", () => {
    expect(MAX_NOTIFICATIONS).toBe(50);
  });
});
