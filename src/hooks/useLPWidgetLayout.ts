import { useState, useEffect, useCallback } from "react";

export interface Widget {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: "portfolio-summary", label: "Portfolio Summary", visible: true, order: 0 },
  { id: "analytics-chart", label: "Analytics Chart", visible: true, order: 1 },
  { id: "yield-comparison", label: "Yield Comparison", visible: true, order: 2 },
  { id: "risk-summary", label: "Risk Summary", visible: true, order: 3 },
  { id: "insurance-pool", label: "Insurance Pool", visible: true, order: 4 },
  { id: "portfolio-table", label: "Portfolio Table", visible: true, order: 5 },
];

export function useLPWidgetLayout(userId: string | null) {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = userId ? `iln_lp_widget_layout_${userId}` : null;

  useEffect(() => {
    if (!storageKey) {
      setIsLoaded(true);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWidgets(parsed);
      }
    } catch {
      setWidgets(DEFAULT_WIDGETS);
    }
    setIsLoaded(true);
  }, [storageKey]);

  const updateWidgets = useCallback(
    (newWidgets: Widget[]) => {
      setWidgets(newWidgets);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newWidgets));
        } catch {
          // localStorage full or unavailable
        }
      }
    },
    [storageKey]
  );

  const toggleWidget = useCallback(
    (widgetId: string) => {
      setWidgets((prev) => {
        const updated = prev.map((w) =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w
        );
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {
            // localStorage full
          }
        }
        return updated;
      });
    },
    [storageKey]
  );

  const reorderWidgets = useCallback(
    (fromIndex: number, toIndex: number) => {
      setWidgets((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        const reordered = updated.map((w, i) => ({ ...w, order: i }));
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(reordered));
          } catch {
            // localStorage full
          }
        }
        return reordered;
      });
    },
    [storageKey]
  );

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // localStorage unavailable
      }
    }
  }, [storageKey]);

  const visibleWidgets = widgets.filter((w) => w.visible);

  return {
    widgets,
    visibleWidgets,
    toggleWidget,
    reorderWidgets,
    resetLayout,
    updateWidgets,
    isLoaded,
  };
}
