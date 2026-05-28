export type ReputationEventType = "paid" | "defaulted" | "decay";
export type ReputationRange = "30d" | "90d" | "all";

export interface ReputationUpdatedEvent {
  type: "ReputationUpdated";
  score: number;
  eventType: ReputationEventType;
  timestamp?: number;
  ledger?: number;
}

export interface ReputationHistoryPoint {
  score: number;
  eventType: ReputationEventType;
  timestamp: number;
  ledger?: number;
  label: string;
}

const DAY_MS = 86_400_000;

export function buildReputationHistory(
  events: ReputationUpdatedEvent[],
  range: ReputationRange = "90d",
  now = Date.now(),
): ReputationHistoryPoint[] {
  const minTimestamp =
    range === "all"
      ? 0
      : Math.floor((now - (range === "30d" ? 30 : 90) * DAY_MS) / 1000);

  return events
    .filter((event) => event.type === "ReputationUpdated")
    .map((event) => {
      const timestamp = event.timestamp ?? (event.ledger ? event.ledger * 5 : 0);
      return {
        score: Math.max(0, Math.min(100, event.score)),
        eventType: event.eventType,
        timestamp,
        ledger: event.ledger,
        label: event.ledger
          ? `Ledger ${event.ledger}`
          : new Date(timestamp * 1000).toLocaleDateString(),
      };
    })
    .filter((point) => range === "all" || point.timestamp >= minTimestamp)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function hasEnoughReputationHistory(points: ReputationHistoryPoint[]): boolean {
  return points.length >= 2;
}
