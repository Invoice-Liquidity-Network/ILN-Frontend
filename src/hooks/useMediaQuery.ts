'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 *
 * SSR-safe: returns `false` during server render and the first client render,
 * then syncs to the real value in an effect to avoid hydration mismatches.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 639px)");
 */
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches);
    };

    // Sync immediately in case the query already matches on mount.
    handleChange(mediaQueryList);

    // `addEventListener` is the modern API; fall back to `addListener` for
    // older Safari/jsdom environments.
    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, [query]);

  return matches;
}

/** Breakpoint used across data tables for progressive disclosure (< 640px). */
export const MOBILE_QUERY = '(max-width: 639px)';
