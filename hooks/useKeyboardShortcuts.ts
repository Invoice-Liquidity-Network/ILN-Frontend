import { useCallback, useEffect, useState } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (element as HTMLElement).isContentEditable
  );
}

export function useKeyboardShortcuts() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const openShortcuts = useCallback(() => setIsShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setIsShortcutsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isShortcutsOpen) {
        event.preventDefault();
        closeShortcuts();
        return;
      }

      if (event.key !== "?") return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      openShortcuts();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsOpen, openShortcuts, closeShortcuts]);

  return {
    isShortcutsOpen,
    openShortcuts,
    closeShortcuts,
  };
}
