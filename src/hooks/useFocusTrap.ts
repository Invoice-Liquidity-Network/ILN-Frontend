import { useEffect, useRef } from "react";

/**
 * Hook to trap focus within a container element.
 * Used for modals and dialogs to ensure keyboard users stay within the interactive area.
 *
 * @param isActive - Whether the focus trap should be active
 * @param onEscape - Callback when Escape key is pressed
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(isActive: boolean = true, onEscape?: () => void) {
  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store the previously focused element to restore focus when trap is deactivated
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus the first element when trap activates
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: move to previous element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: move to next element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously active element
      previousActiveElementRef.current?.focus();
    };
  }, [isActive, onEscape]);

  return containerRef;
}
