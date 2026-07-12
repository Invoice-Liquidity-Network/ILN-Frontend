'use client';

import { useState, useEffect, useCallback } from 'react';
import { WHATS_NEW, WhatsNewItem } from '@/data/whats-new';

const WHATS_NEW_VERSION_KEY = 'iln:last-seen-version';
const MAX_VISIBLE_ITEMS = 5;

export function useWhatsNew() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<WhatsNewItem[]>([]);

  const currentVersion =
    process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || 'dev';

  useEffect(() => {
    // Determine visibility once on mount
    const storedVersion = localStorage.getItem(WHATS_NEW_VERSION_KEY);

    if (storedVersion === null) {
      // First-time visitor: Save current version, do not show modal
      localStorage.setItem(WHATS_NEW_VERSION_KEY, currentVersion);
    } else if (storedVersion !== currentVersion) {
      // Returning user, new version: Show modal
      // Prepare the 5 most recent items (assuming WHATS_NEW is ordered newest first)
      setItems(WHATS_NEW.slice(0, MAX_VISIBLE_ITEMS));
      setIsOpen(true);
    }
  }, [currentVersion]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(WHATS_NEW_VERSION_KEY, currentVersion);
  }, [currentVersion]);

  return {
    isOpen,
    dismiss,
    items,
    currentVersion,
  };
}
