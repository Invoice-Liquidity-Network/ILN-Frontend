/**
 * Wallet session storage cleanup (#4).
 *
 * On disconnect we must drop every trace of the previous session: the stored
 * address plus any wallet-scoped caches (address book, watchlist, referral
 * attribution, cached invoice/portfolio data). Centralised here so disconnect
 * has a single, testable definition of "what counts as session data".
 */

export const WALLET_ADDRESS_STORAGE_KEY = 'iln_wallet_address';
export const WALLET_PROVIDER_STORAGE_KEY = 'iln_wallet_provider';

export const WALLET_RECORD_PREFIX = 'iln-wallet-record:v1';
/**
 * Wallet-linked caches are retained for 30 days after their latest write.
 * A successful mutation refreshes the complete record's retention window;
 * expired records are removed before their payload can reach application code.
 */
export const DEFAULT_WALLET_RECORD_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type WalletStorageError =
  | 'CORRUPT_DATA'
  | 'INTEGRITY_FAILED'
  | 'EXPIRED'
  | 'SCOPE_MISMATCH'
  | 'STORAGE_UNAVAILABLE';

interface WalletStorageScope {
  origin: string;
  network: string;
  wallet: string;
}

interface WalletStorageEnvelope<T> {
  version: 1;
  scope: WalletStorageScope;
  createdAt: number;
  expiresAt: number;
  payload: T;
  integrity: string;
}

export type WalletStorageReadResult<T> =
  | { status: 'missing' }
  | { status: 'found'; value: T }
  | { status: 'recovered'; error: WalletStorageError };

export type WalletStorageWriteResult = { ok: true } | { ok: false; error: 'STORAGE_UNAVAILABLE' };

export interface WalletStorageOptions {
  storage?: Storage;
  origin?: string;
  network?: string;
  now?: number;
  ttlMs?: number;
}

function defaultOrigin(): string {
  return typeof window === 'undefined' ? 'server' : window.location.origin;
}

function normalizeScopePart(value: string): string {
  return encodeURIComponent(value.trim().toLowerCase());
}

function scopeFor(wallet: string, options: WalletStorageOptions): WalletStorageScope {
  return {
    origin: options.origin ?? defaultOrigin(),
    network: (options.network ?? 'unknown').trim().toLowerCase(),
    wallet,
  };
}

export function getWalletStorageKey(
  recordType: string,
  wallet: string,
  options: Pick<WalletStorageOptions, 'origin' | 'network'> = {}
): string {
  const scope = scopeFor(wallet, options);
  return [
    WALLET_RECORD_PREFIX,
    normalizeScopePart(scope.origin),
    normalizeScopePart(scope.network),
    normalizeScopePart(wallet),
    normalizeScopePart(recordType),
  ].join(':');
}

// SHA-256 is implemented locally so integrity checks remain synchronous and
// writes can preserve the hook's existing API. It protects persisted records
// from accidental or out-of-band modification; localStorage is not treated as
// a confidentiality boundary.
function sha256(value: string): string {
  const rightRotate = (n: number, amount: number) => (n >>> amount) | (n << (32 - amount));
  const maxWord = 2 ** 32;
  const words: number[] = [];
  const ascii = unescape(encodeURIComponent(value));
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate += 1) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = true;
      hash[primeCounter] = (candidate ** 0.5 * maxWord) | 0;
      k[primeCounter] = (candidate ** (1 / 3) * maxWord) | 0;
      primeCounter += 1;
    }
  }
  const bitLength = ascii.length * 8;
  let message = `${ascii}\x80`;
  while (message.length % 64 !== 56) message += '\x00';
  for (let i = 0; i < message.length; i += 1) {
    const code = message.charCodeAt(i);
    words[i >> 2] |= code << ((3 - (i % 4)) * 8);
  }
  words.push((bitLength / maxWord) | 0, bitLength | 0);
  for (let offset = 0; offset < words.length; offset += 16) {
    const oldHash = [...hash];
    const schedule = words.slice(offset, offset + 16);
    for (let i = 0; i < 64; i += 1) {
      const w15 = schedule[i - 15];
      const w2 = schedule[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (schedule[i] =
          i < 16
            ? schedule[i]
            : (schedule[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                schedule[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash.pop();
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i += 1) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  return hash.map((word) => (word >>> 0).toString(16).padStart(8, '0')).join('');
}

function signedContent<T>(envelope: Omit<WalletStorageEnvelope<T>, 'integrity'>): string {
  return JSON.stringify(envelope);
}

export function writeWalletRecord<T>(
  recordType: string,
  wallet: string,
  payload: T,
  options: WalletStorageOptions = {}
): WalletStorageWriteResult {
  const storage = options.storage ?? window.localStorage;
  const createdAt = options.now ?? Date.now();
  const unsigned = {
    version: 1 as const,
    scope: scopeFor(wallet, options),
    createdAt,
    expiresAt: createdAt + (options.ttlMs ?? DEFAULT_WALLET_RECORD_TTL_MS),
    payload,
  };
  try {
    storage.setItem(
      getWalletStorageKey(recordType, wallet, options),
      JSON.stringify({ ...unsigned, integrity: sha256(signedContent(unsigned)) })
    );
    return { ok: true };
  } catch {
    return { ok: false, error: 'STORAGE_UNAVAILABLE' };
  }
}

export function readWalletRecord<T>(
  recordType: string,
  wallet: string,
  options: WalletStorageOptions = {}
): WalletStorageReadResult<T> {
  const storage = options.storage ?? window.localStorage;
  const key = getWalletStorageKey(recordType, wallet, options);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { status: 'recovered', error: 'STORAGE_UNAVAILABLE' };
  }
  if (raw === null) return { status: 'missing' };

  let error: WalletStorageError | null = null;
  try {
    const envelope = JSON.parse(raw) as WalletStorageEnvelope<T>;
    const expectedScope = scopeFor(wallet, options);
    if (
      envelope.version !== 1 ||
      typeof envelope.createdAt !== 'number' ||
      typeof envelope.expiresAt !== 'number' ||
      !envelope.scope ||
      typeof envelope.integrity !== 'string'
    ) {
      error = 'CORRUPT_DATA';
    } else if (
      envelope.scope.origin !== expectedScope.origin ||
      envelope.scope.network !== expectedScope.network ||
      envelope.scope.wallet !== expectedScope.wallet
    ) {
      error = 'SCOPE_MISMATCH';
    } else if ((options.now ?? Date.now()) >= envelope.expiresAt) {
      error = 'EXPIRED';
    } else {
      const { integrity, ...unsigned } = envelope;
      if (sha256(signedContent(unsigned)) !== integrity) error = 'INTEGRITY_FAILED';
      else return { status: 'found', value: envelope.payload };
    }
  } catch {
    error = 'CORRUPT_DATA';
  }

  try {
    storage.removeItem(key);
  } catch {
    return { status: 'recovered', error: 'STORAGE_UNAVAILABLE' };
  }
  return { status: 'recovered', error: error ?? 'CORRUPT_DATA' };
}

export type WalletProviderType = 'freighter' | 'walletconnect';

export function getStoredWalletProvider(
  storage: Storage = window.localStorage
): WalletProviderType | null {
  const value = storage.getItem(WALLET_PROVIDER_STORAGE_KEY);
  return value === 'freighter' || value === 'walletconnect' ? value : null;
}

export function setStoredWalletProvider(
  provider: WalletProviderType,
  storage: Storage = window.localStorage
): void {
  storage.setItem(WALLET_PROVIDER_STORAGE_KEY, provider);
}

/** Prefixes/keys considered user-session data, removed on disconnect. */
export const WALLET_SCOPED_PREFIXES = [
  'iln-address-book-',
  WALLET_RECORD_PREFIX,
  'iln-watchlist',
  'iln-referral-',
  'iln-invoices-',
  'iln-portfolio-',
  'freelancerInvoices',
];

export function clearWalletStorage(storage: Storage = window.localStorage): void {
  storage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
  storage.removeItem(WALLET_PROVIDER_STORAGE_KEY);
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && WALLET_SCOPED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => storage.removeItem(key));
}
