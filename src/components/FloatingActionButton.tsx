"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface FloatingActionButtonProps {
  /** If false, the FAB is hidden (e.g. on the submit page itself) */
  visible?: boolean;
}

export default function FloatingActionButton({ visible = true }: FloatingActionButtonProps) {
  const { openQuickSubmit } = useKeyboardShortcuts();

  if (!visible) return null;

  return (
    <button
      id="fab-quick-submit"
      aria-label="Quick submit invoice"
      onClick={openQuickSubmit}
      className={[
        "fixed bottom-8 right-8 z-[60]",
        "flex items-center gap-2 pl-5 pr-6 py-4",
        "bg-primary text-surface-container-lowest",
        "rounded-full shadow-2xl",
        "font-bold text-sm",
        "hover:bg-primary/90 active:scale-95",
        "transition-all duration-200",
        "focus:outline-none focus:ring-4 focus:ring-primary/40",
      ].join(" ")}
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
        add
      </span>
      New Invoice
    </button>
  );
}
