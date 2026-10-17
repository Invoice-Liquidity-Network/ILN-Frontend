import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { isValidStellarAddress } from '@/utils/governance';
import { getConfiguredStellarNetwork } from '@/utils/network';
import {
  getWalletStorageKey,
  readWalletRecord,
  writeWalletRecord,
  type WalletStorageError,
} from '@/utils/walletStorage';

export interface AddressBookEntry {
  id: string;
  address: string;
  nickname: string;
}

/** Reason a mutating operation failed, returned to the caller for UI feedback. */
export type AddressBookError =
  | 'INVALID_ADDRESS'
  | 'DUPLICATE_ADDRESS'
  | 'MISSING_FIELDS'
  | 'PERSIST_FAILED';

/** Discriminated result from operations that can fail. */
export type AddressBookResult = { ok: true } | { ok: false; error: AddressBookError };

const STORAGE_RECORD_TYPE = 'address-book';

// Date.now() alone collides for entries created within the same millisecond,
// which made deleteAddress() remove every entry added in the same tick.
function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Reject well-formed envelopes whose payload is not a minimal address book. */
function isAddressBook(value: unknown): value is AddressBookEntry[] {
  return (
    Array.isArray(value) &&
    value.length <= 50 &&
    value.every(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        typeof (entry as AddressBookEntry).id === 'string' &&
        typeof (entry as AddressBookEntry).address === 'string' &&
        typeof (entry as AddressBookEntry).nickname === 'string'
    )
  );
}

export default function useAddressBook() {
  const { address: walletAddress } = useWallet();
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [storageStatus, setStorageStatus] = useState<'loading' | 'ready' | 'recovered'>('loading');
  const [storageError, setStorageError] = useState<WalletStorageError | null>(null);
  const network = getConfiguredStellarNetwork();

  useEffect(() => {
    setStorageStatus('loading');
    setStorageError(null);
    if (!walletAddress) {
      setAddressBook([]);
      setStorageStatus('ready');
      return;
    }
    const stored = readWalletRecord<AddressBookEntry[]>(STORAGE_RECORD_TYPE, walletAddress, {
      network,
    });
    if (stored.status === 'found' && isAddressBook(stored.value)) {
      setAddressBook(stored.value);
      setStorageStatus('ready');
      return;
    }
    if (stored.status === 'found') {
      localStorage.removeItem(getWalletStorageKey(STORAGE_RECORD_TYPE, walletAddress, { network }));
      setStorageError('CORRUPT_DATA');
      setStorageStatus('recovered');
    } else if (stored.status === 'recovered') {
      setStorageError(stored.error);
      setStorageStatus('recovered');
    } else {
      setStorageStatus('ready');
    }
    setAddressBook([]);
  }, [network, walletAddress]);

  const tryPersist = useCallback(
    (entries: AddressBookEntry[]): boolean =>
      Boolean(
        walletAddress &&
          writeWalletRecord(STORAGE_RECORD_TYPE, walletAddress, entries, { network }).ok
      ),
    [network, walletAddress]
  );

  /**
   * Add a new entry.
   * Validates format and detects duplicates before touching state.
   * Returns a result object so callers can surface the right error message.
   */
  const addAddress = useCallback(
    (address: string, nickname: string): AddressBookResult => {
      if (!address || !nickname) return { ok: false, error: 'MISSING_FIELDS' };

      if (!isValidStellarAddress(address)) return { ok: false, error: 'INVALID_ADDRESS' };

      // Duplicate: exact address match — surface an explicit error instead of
      // silently updating the nickname, which was invisible to the user.
      if (addressBook.some((entry) => entry.address === address)) {
        return { ok: false, error: 'DUPLICATE_ADDRESS' };
      }

      const newEntry: AddressBookEntry = { id: createEntryId(), address, nickname };
      // Enforce max 50 entries by evicting the oldest (first) when at capacity.
      const next =
        addressBook.length >= 50 ? [...addressBook.slice(1), newEntry] : [...addressBook, newEntry];

      if (walletAddress && !tryPersist(next)) {
        return { ok: false, error: 'PERSIST_FAILED' };
      }

      setAddressBook(next);
      return { ok: true };
    },
    [addressBook, walletAddress, tryPersist]
  );

  /**
   * Update an existing entry by id.
   * Validates the new address format and checks for duplicates against other entries.
   * Rolls back state on persistence failure.
   */
  const updateAddress = useCallback(
    (id: string, updates: Partial<Omit<AddressBookEntry, 'id'>>): AddressBookResult => {
      if (updates.address !== undefined) {
        if (!isValidStellarAddress(updates.address)) {
          return { ok: false, error: 'INVALID_ADDRESS' };
        }
        // Duplicate check: another entry (not the one being edited) uses this address
        if (addressBook.some((entry) => entry.id !== id && entry.address === updates.address)) {
          return { ok: false, error: 'DUPLICATE_ADDRESS' };
        }
      }

      const next = addressBook.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry));

      if (walletAddress && !tryPersist(next)) {
        // Do NOT update React state — UI stays consistent with what is on disk.
        return { ok: false, error: 'PERSIST_FAILED' };
      }

      setAddressBook(next);
      return { ok: true };
    },
    [addressBook, walletAddress, tryPersist]
  );

  const deleteAddress = useCallback(
    (id: string): AddressBookResult => {
      const next = addressBook.filter((entry) => entry.id !== id);
      if (walletAddress && !tryPersist(next)) {
        return { ok: false, error: 'PERSIST_FAILED' };
      }
      setAddressBook(next);
      return { ok: true };
    },
    [addressBook, walletAddress, tryPersist]
  );

  const searchAddresses = useCallback(
    (query: string) => {
      if (!query) return addressBook;
      const lowerQuery = query.toLowerCase();
      return addressBook.filter(
        (entry) =>
          entry.nickname.toLowerCase().includes(lowerQuery) ||
          entry.address.toLowerCase().includes(lowerQuery)
      );
    },
    [addressBook]
  );

  return {
    addressBook,
    addAddress,
    updateAddress,
    deleteAddress,
    searchAddresses,
    storageStatus,
    storageError,
  };
}
