'use client';

import { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface FloatingActionButtonProps {
  /** If false, the FAB is hidden (e.g. on the submit page itself) */
  visible?: boolean;
}

export default function FloatingActionButton({ visible = true }: FloatingActionButtonProps) {
  const { openQuickSubmit, isQuickSubmitOpen } = useKeyboardShortcuts();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Return focus to the FAB once the quick-submit drawer it opened closes again
  // (whether dismissed via Escape, the backdrop, or submit) so keyboard and
  // screen-reader users are not dropped at the top of the document (#309).
  useEffect(() => {
    if (wasOpenRef.current && !isQuickSubmitOpen) {
      buttonRef.current?.focus();
    }
    wasOpenRef.current = isQuickSubmitOpen;
  }, [isQuickSubmitOpen]);

  if (!visible) return null;

  return (
    <button
      ref={buttonRef}
      id="fab-quick-submit"
      type="button"
      tabIndex={0}
      aria-label="Quick submit invoice"
      aria-haspopup="dialog"
      aria-expanded={isQuickSubmitOpen}
      onClick={openQuickSubmit}
      className={[
        'fixed bottom-8 right-8 z-[60]',
        'flex items-center gap-2 pl-5 pr-6 py-4',
        'bg-primary text-surface-container-lowest',
        'rounded-full shadow-2xl',
        'font-bold text-sm',
        'hover:bg-primary/90 active:scale-95',
        'transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-primary/40',
      ].join(' ')}
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
        add
      </span>
      New Invoice
    </button>
  );
}
