import { useState, useEffect, useCallback, useRef } from 'react';
import { getInvoice } from '@/utils/soroban';
import { useToast } from '@/context/ToastContext';

export interface WatchlistItem {
  id: string; // Storing as string to avoid bigint serialization issues in localStorage
  addedAt: number;
  lastKnownStatus?: string;
}

const MAX_WATCHLIST_SIZE = 50;
const POLL_INTERVAL_MS = 60_000;

export function useWatchlist(walletAddress: string | null) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const { addToast } = useToast();
  const previousStatusesRef = useRef<Map<string, string>>(new Map());

  // Load from localStorage on mount or when address changes
  useEffect(() => {
    if (!walletAddress) {
      setWatchlist([]);
      previousStatusesRef.current.clear();
      return;
    }

    try {
      const stored = localStorage.getItem(`watchlist_${walletAddress}`);
      if (stored) {
        const parsed: WatchlistItem[] = JSON.parse(stored);
        setWatchlist(parsed);
        // Seed the previous status map so first poll doesn't spam toasts
        parsed.forEach((item) => {
          if (item.lastKnownStatus) {
            previousStatusesRef.current.set(item.id, item.lastKnownStatus);
          }
        });
      } else {
        setWatchlist([]);
      }
    } catch (e) {
      console.error('Failed to load watchlist from local storage', e);
      setWatchlist([]);
    }
  }, [walletAddress]);

  const saveWatchlist = useCallback((newList: WatchlistItem[]) => {
    if (!walletAddress) return;
    try {
      localStorage.setItem(`watchlist_${walletAddress}`, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save watchlist to local storage', e);
    }
  }, [walletAddress]);

  // Real-time polling with Page Visibility API
  useEffect(() => {
    if (!walletAddress || watchlist.length === 0) return;

    const pollStatuses = async () => {
      if (document.hidden) return;

      const ids = watchlist.map((item: WatchlistItem) => item.id);
      const results = await Promise.allSettled(
        ids.map((id: string) => getInvoice(BigInt(id)))
      );

      setWatchlist((current: WatchlistItem[]) => {
        let changed = false;
        const updated = current.map((item: WatchlistItem, index: number) => {
          const result = results[index];
          if (result.status !== 'fulfilled') return item;

          const newStatus = result.value.status;
          const prevStatus = previousStatusesRef.current.get(item.id);

          if (prevStatus !== undefined && prevStatus !== newStatus) {
            addToast({
              type: 'info',
              title: `Invoice #${item.id} updated`,
              message: `Status changed from ${prevStatus} to ${newStatus}`,
            });
          }

          previousStatusesRef.current.set(item.id, newStatus);

          if (item.lastKnownStatus !== newStatus) {
            changed = true;
            return { ...item, lastKnownStatus: newStatus };
          }
          return item;
        });

        if (changed) {
          saveWatchlist(updated);
          return updated;
        }
        return current;
      });
    };

    pollStatuses();
    const interval = window.setInterval(pollStatuses, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) pollStatuses();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [walletAddress, watchlist.length, addToast, saveWatchlist]);

  const addToWatchlist = useCallback((invoiceId: bigint) => {
    const idStr = invoiceId.toString();
    setWatchlist((current: WatchlistItem[]) => {
      if (current.some((item: WatchlistItem) => item.id === idStr)) {
        return current;
      }
      if (current.length >= MAX_WATCHLIST_SIZE) {
        throw new Error(`Watchlist limit of ${MAX_WATCHLIST_SIZE} invoices reached. Please remove some before adding new ones.`);
      }
      const newList = [...current, { id: idStr, addedAt: Date.now() }];
      saveWatchlist(newList);
      return newList;
    });
  }, [saveWatchlist]);

  const removeFromWatchlist = useCallback((invoiceId: bigint) => {
    const idStr = invoiceId.toString();
    previousStatusesRef.current.delete(idStr);
    setWatchlist((current: WatchlistItem[]) => {
      const newList = current.filter((item: WatchlistItem) => item.id !== idStr);
      saveWatchlist(newList);
      return newList;
    });
  }, [saveWatchlist]);

  const toggleWatchlist = useCallback((invoiceId: bigint) => {
    const idStr = invoiceId.toString();
    setWatchlist((current: WatchlistItem[]) => {
      if (current.some((item: WatchlistItem) => item.id === idStr)) {
        previousStatusesRef.current.delete(idStr);
        const newList = current.filter((item: WatchlistItem) => item.id !== idStr);
        saveWatchlist(newList);
        return newList;
      } else {
        if (current.length >= MAX_WATCHLIST_SIZE) {
          throw new Error(`Watchlist limit of ${MAX_WATCHLIST_SIZE} invoices reached. Please remove some before adding new ones.`);
        }
        const newList = [...current, { id: idStr, addedAt: Date.now() }];
        saveWatchlist(newList);
        return newList;
      }
    });
  }, [saveWatchlist]);

  const isInWatchlist = useCallback((invoiceId: bigint) => {
    return watchlist.some((item: WatchlistItem) => item.id === invoiceId.toString());
  }, [watchlist]);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  };
}
