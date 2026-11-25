'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import TransactionPreviewModal from '@/components/TransactionPreviewModal';
import { decodeTransactionXdr, type DecodedTransaction } from '@/utils/decodeTransaction';
import type { ExpectedTransactionAction } from '@/utils/transactionPattern';

type ResolveFn = () => void;
type RejectFn = (error: Error) => void;

interface PreviewState {
  isOpen: boolean;
  decoded: DecodedTransaction | null;
  rawXdr: string;
  expectedAction?: ExpectedTransactionAction;
}

interface UseTransactionPreviewReturn {
  previewModal: React.ReactNode;
  requestPreview: (txXdr: string, expectedAction?: ExpectedTransactionAction) => Promise<boolean>;
}

/**
 * Gates wallet signing behind an explicit XDR payload/destination/value preview (#1290).
 *
 * Assumptions & data sources:
 * - `txXdr` is the unsigned Stellar transaction envelope XDR produced for the wallet to sign.
 * - `decodeTransactionXdr` parses the envelope locally without trusting caller-supplied labels;
 *   if decoding fails, `TransactionPreviewModal` still renders the raw XDR and an undecodable warning.
 * - `expectedAction` (when supplied) is cross-checked by `TransactionPreviewModal` via
 *   `findTransactionPatternMismatches` so UI intent and decoded payload cannot silently diverge.
 * - Consumers using `useTransaction()` MUST mount `signingModal` (which renders `previewModal`);
 *   otherwise the modal cannot appear and `requestPreview` will remain pending until unmount.
 *
 * Observable behavior:
 * - Normal: `requestPreview` opens the modal, resolves `true` on confirm, and restores trigger focus.
 * - Cancelled: `onCancel` / Escape closes the modal, restores focus, and rejects with
 *   `Transaction cancelled by user`.
 * - Repeated / concurrent: a second `requestPreview` while one is already awaiting confirmation is
 *   rejected immediately so an active previewed XDR cannot be swapped out under the user's cursor.
 * - Malformed / empty XDR: empty or whitespace-only `txXdr` is rejected before opening the modal.
 * - Interrupted (unmount): any pending preview promise is rejected on unmount so callers never hang.
 */
export function useTransactionPreview(): UseTransactionPreviewReturn {
  const [preview, setPreview] = useState<PreviewState>({
    isOpen: false,
    decoded: null,
    rawXdr: '',
  });

  const resolverRef = useRef<{
    resolve: ResolveFn;
    reject: RejectFn;
  } | null>(null);
  // The element that had focus when the modal opened (e.g. the "Pay" button
  // that triggered this preview), so keyboard/screen-reader focus returns
  // there on close instead of being dropped to <body> (#1128).
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    triggerElementRef.current?.focus();
    triggerElementRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      const pending = resolverRef.current;
      if (pending) {
        resolverRef.current = null;
        pending.reject(new Error('Transaction preview interrupted'));
      }
    };
  }, []);

  const handleConfirm = useCallback(() => {
    const resolver = resolverRef.current;
    if (!resolver) return;
    resolverRef.current = null;
    setPreview((prev) => ({ ...prev, isOpen: false }));
    restoreFocus();
    resolver.resolve();
  }, [restoreFocus]);

  const handleCancel = useCallback(() => {
    const resolver = resolverRef.current;
    if (!resolver) return;
    resolverRef.current = null;
    setPreview((prev) => ({ ...prev, isOpen: false }));
    restoreFocus();
    resolver.reject(new Error('Transaction cancelled by user'));
  }, [restoreFocus]);

  const requestPreview = useCallback(
    (txXdr: string, expectedAction?: ExpectedTransactionAction): Promise<boolean> => {
      if (!txXdr || !txXdr.trim()) {
        return Promise.reject(new Error('Transaction payload (XDR) is required for preview.'));
      }

      if (resolverRef.current) {
        return Promise.reject(new Error('A transaction preview is already awaiting confirmation.'));
      }

      const decoded = decodeTransactionXdr(txXdr);
      triggerElementRef.current =
        typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      return new Promise<boolean>((resolve, reject) => {
        resolverRef.current = {
          resolve: () => resolve(true),
          reject: (err) => reject(err),
        };

        setPreview({
          isOpen: true,
          decoded,
          expectedAction,
          rawXdr: txXdr,
        });
      });
    },
    []
  );

  const previewModal = preview.isOpen ? (
    <TransactionPreviewModal
      decoded={preview.decoded}
      expectedAction={preview.expectedAction}
      rawXdr={preview.rawXdr}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { previewModal, requestPreview };
}
