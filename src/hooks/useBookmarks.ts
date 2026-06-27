import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "iln-bookmarks";
const MAX_BOOKMARKS = 100;

function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

export interface UseBookmarksReturn {
  bookmarkedIds: Set<string>;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string, bookmarked: boolean) => void;
  clearAll: () => void;
  count: number;
  atLimit: boolean;
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(loadBookmarks);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarkedIds]));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  const isBookmarked = useCallback((id: string) => bookmarkedIds.has(id), [bookmarkedIds]);

  const toggleBookmark = useCallback((id: string, shouldBookmark: boolean) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (shouldBookmark) {
        if (next.size >= MAX_BOOKMARKS) return prev;
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setBookmarkedIds(new Set());
  }, []);

  return {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    clearAll,
    count: bookmarkedIds.size,
    atLimit: bookmarkedIds.size >= MAX_BOOKMARKS,
  };
}
