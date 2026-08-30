'use client';

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { NETWORK_NAME } from '@/constants';
import { useWallet } from '@/context/WalletContext';
import { useTransaction } from '@/hooks/useTransaction';
import { useApprovedTokens } from '@/hooks/useApprovedTokens';
import {
  getYieldPreview,
  type InvoiceFormValues,
  validateInvoiceForm,
  parseAmountToUnits,
  parseDiscountRateToBps,
  toUnixTimestamp,
} from '@/utils/invoiceSubmission';
import { getTokenInputDecimals } from '@/utils/token-amount-input';
import { submitInvoiceTransaction } from '@/utils/soroban';
import { useToast } from '@/context/ToastContext';
import { PreviewRow } from './invoice/FormHelpers';
import SubmitStepDetails from './invoice/SubmitStepDetails';
import SubmitStepTokenRate from './invoice/SubmitStepTokenRate';
import SubmitStepReview from './invoice/SubmitStepReview';

const INITIAL_FORM: InvoiceFormValues = {
  payer: '',
  amount: '',
  dueDate: '',
  discountRate: '3.00',
  tokenId: '',
};

type FormAction =
  | { type: 'set_field'; field: keyof InvoiceFormValues; value: string }
  | { type: 'reset'; values: InvoiceFormValues };

function invoiceFormReducer(state: InvoiceFormValues, action: FormAction): InvoiceFormValues {
  switch (action.type) {
    case 'set_field':
      return { ...state, [action.field]: action.value };
    case 'reset':
      return action.values;
  }
}

const STEPS = [
  { id: 1, label: 'Invoice Details' },
  { id: 2, label: 'Token & Rate' },
  { id: 3, label: 'Review & Submit' },
];

interface SubmitInvoiceFormProps {
  initialValues?: Partial<InvoiceFormValues>;
  prefillId?: string;
}

export default function SubmitInvoiceForm({ initialValues, prefillId }: SubmitInvoiceFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { execute, loading: txLoading, error: txError, signingModal } = useTransaction();
  const {
    address,
    isConnected,
    connect,
    disconnect,
    networkMismatch,
    error: walletError,
  } = useWallet();
  const {
    tokens,
    tokenMap,
    defaultToken,
    isLoading: tokensLoading,
    error: tokensError,
  } = useApprovedTokens();

  const [showBanner, setShowBanner] = useState(!!prefillId);
  const [form, dispatchForm] = useReducer(invoiceFormReducer, {
    ...INITIAL_FORM,
    ...initialValues,
    dueDate: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof InvoiceFormValues | 'all', boolean>>>(
    {}
  );
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<
    Partial<Record<keyof InvoiceFormValues | 'wallet' | 'submit', string>>
  >({});
  const [submittedInvoiceId, setSubmittedInvoiceId] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState(() => searchParams.get('ref') ?? '');
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

  const effectiveTokenId = form.tokenId || defaultToken?.contractId || '';
  const selectedToken = tokenMap.get(effectiveTokenId) ?? defaultToken ?? null;
  const amountInputDecimals = getTokenInputDecimals(selectedToken?.symbol ?? 'USDC');

  const validationErrors = useMemo(() => {
    const errs = validateInvoiceForm(
      { ...form, tokenId: effectiveTokenId },
      isConnected,
      selectedToken?.decimals ?? 7,
      selectedToken?.symbol ?? 'token'
    );
    if (!selectedToken && !tokensLoading) {
      errs.tokenId = t('submitForm.noTokensAvailable');
    }
    if (networkMismatch) {
      errs.wallet = t('submitForm.walletError', { network: NETWORK_NAME });
    }
    return errs;
  }, [form, effectiveTokenId, isConnected, selectedToken, tokensLoading, networkMismatch, t]);

  const displayErrors = useMemo(() => {
    const combined: Record<string, string | undefined> = { ...errors };
    for (const [key, val] of Object.entries(validationErrors)) {
      if (touched[key as keyof InvoiceFormValues] || touched.all) {
        combined[key] = val;
      }
    }
    return combined;
  }, [validationErrors, touched, errors]);

  const handleBlur = (field: keyof InvoiceFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isStep1Valid =
    !validationErrors.payer &&
    !validationErrors.amount &&
    !validationErrors.dueDate &&
    !validationErrors.wallet;
  const isStep2Valid = !validationErrors.tokenId && !validationErrors.discountRate;
  const isFormValid = isStep1Valid && isStep2Valid;

  const setField = (field: keyof InvoiceFormValues, value: string) => {
    dispatchForm({ type: 'set_field', field, value });
    setErrors((current) => ({ ...current, submit: undefined }));
    setSubmittedInvoiceId(null);
  };

  const goNext = () => {
    if (step === 1 && !isStep1Valid) {
      setTouched((prev) => ({ ...prev, payer: true, amount: true, dueDate: true }));
      return;
    }
    if (step === 2 && !isStep2Valid) {
      setTouched((prev) => ({ ...prev, tokenId: true, discountRate: true }));
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const handleCopyInvoiceId = async () => {
    if (!submittedInvoiceId) return;

    try {
      await navigator.clipboard.writeText(submittedInvoiceId);
      addToast({
        type: 'success',
        title: 'Invoice ID copied',
        message: `Invoice #${submittedInvoiceId} copied to clipboard.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Copy failed',
        message: 'Unable to copy the invoice ID on this device.',
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      setTouched({
        payer: true,
        amount: true,
        dueDate: true,
        tokenId: true,
        discountRate: true,
        all: true,
      });
      return;
    }

    const amount = parseAmountToUnits(form.amount, amountInputDecimals);
    const dueDate = toUnixTimestamp(form.dueDate);
    const discountRate = parseDiscountRateToBps(form.discountRate);

    if (
      !address ||
      !selectedToken ||
      amount === null ||
      dueDate === null ||
      discountRate === null
    ) {
      setErrors({ submit: t('submitForm.reviewFormValues') });
      return;
    }

    setErrors({});
    setSubmittedInvoiceId(null);

    const result = await execute(
      async (signTx) =>
        submitInvoiceTransaction({
          freelancer: address,
          payer: form.payer.trim(),
          amount,
          dueDate,
          discountRate,
          signTx,
          token: selectedToken.contractId,
          referralCode: referralCode.trim(),
        }),
      {
        expectedAction: 'submit_invoice',
        title: 'Submitting invoice to Stellar testnet...',
        pendingMessage: 'Waiting for wallet signature...',
        successTitle: 'Invoice submitted',
        successMessage: `Invoice is now live on ${NETWORK_NAME}.`,
      }
    );

    if (!result) {
      setErrors({ submit: txError ?? 'The transaction did not complete successfully.' });
      return;
    }

    const invoiceId = result.invoiceId.toString();
    setSubmittedInvoiceId(invoiceId);
    setLastTxHash(result.txHash);

    const trimmedReferral = referralCode.trim();
    if (trimmedReferral) {
      try {
        window.localStorage.setItem(`iln-referral-${invoiceId}`, trimmedReferral);
      } catch {}
    }

    redirectTimer.current = setTimeout(() => router.push(`/i/${invoiceId}`), 1500);
  };

  return (
    <div
      id="submit-invoice-form"
      className="bg-surface-container-lowest p-6 sm:p-8 rounded-[28px] shadow-xl border border-outline-variant/15"
    >
      {signingModal}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
              {t('submitForm.freelancerPortal')}
            </p>
            <h3 className="text-2xl font-headline mt-2">{t('submitForm.title')}</h3>
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              {t('submitForm.subtitle')}
            </p>
            <div className="mt-4">
              <Link
                href="/invoices/batch"
                className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm text-primary hover:underline font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Submit multiple invoices (CSV/Batch)
              </Link>
            </div>
          </div>

          <div className="sm:min-w-[220px]">
            {isConnected ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                      {t('submitForm.wallet')}
                    </p>
                    <p className="font-mono text-sm break-all mt-1">{address}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                      networkMismatch
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    {networkMismatch ? t('submitForm.wrongNetwork') : NETWORK_NAME}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={disconnect}
                  className="mt-4 w-full rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  {t('submitForm.disconnect')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={connect}
                className="w-full rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-surface-container-lowest shadow-lg hover:bg-primary/90 transition-colors"
              >
                {t('submitForm.connectFreighter')}
              </button>
            )}
          </div>
        </div>

        {displayErrors.wallet || walletError ? (
          <div className="rounded-2xl border border-error/15 bg-error-container/70 px-4 py-3 text-sm text-on-error-container">
            {displayErrors.wallet ?? walletError}
          </div>
        ) : null}

        {showBanner && prefillId && (
          <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 transition-all animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="text-sm font-bold text-primary">
                {t('submitForm.prefilled', { id: prefillId })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="rounded-full p-1 hover:bg-primary/20 text-primary transition-colors"
              aria-label="Dismiss banner"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((item) => {
            const active = item.id === step;
            const complete = item.id < step;
            return (
              <div
                key={item.id}
                className={`rounded-lg border px-4 py-3 ${
                  active
                    ? 'border-primary bg-primary-container/45'
                    : complete
                      ? 'border-primary/25 bg-primary/5'
                      : 'border-outline-variant/15 bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      active || complete
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {complete ? '✓' : item.id}
                  </span>
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {step === 1 && (
              <SubmitStepDetails
                form={form}
                setField={setField}
                displayErrors={displayErrors}
                handleBlur={handleBlur}
                selectedToken={selectedToken}
                referralCode={referralCode}
                setReferralCode={setReferralCode}
              />
            )}
            {step === 2 && (
              <SubmitStepTokenRate
                form={form}
                setField={setField}
                displayErrors={displayErrors}
                handleBlur={handleBlur}
                effectiveTokenId={effectiveTokenId}
                tokens={tokens}
                tokenMap={tokenMap}
                defaultToken={defaultToken}
                tokensLoading={tokensLoading}
                tokensError={tokensError}
                txLoading={txLoading}
              />
            )}
            {step === 3 && (
              <SubmitStepReview
                form={form}
                selectedToken={selectedToken}
              />
            )}

            {displayErrors.submit ? (
              <div className="rounded-2xl border border-error/15 bg-error-container/70 px-4 py-3 text-sm text-on-error-container">
                {displayErrors.submit}
              </div>
            ) : null}

            {submittedInvoiceId ? (
              <div className="rounded-2xl border border-primary/15 bg-primary-container/35 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-on-primary-container/80">
                  {t('submitForm.submissionSuccess')}
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-on-primary-container/80">
                      {t('submitForm.returnedInvoiceId')}
                    </p>
                    <p className="text-2xl font-bold text-on-primary-container">
                      #{submittedInvoiceId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInvoiceId}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors"
                  >
                    {t('submitForm.copyInvoiceId')}
                  </button>
                </div>
                {lastTxHash ? (
                  <p className="mt-3 text-xs text-on-primary-container/80 break-all">
                    {t('submitForm.txHash')}: {lastTxHash}
                  </p>
                ) : null}
                <Link
                  href={`/i/${submittedInvoiceId}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-on-primary-container hover:underline"
                >
                  View invoice details
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                  className="rounded-2xl border border-outline-variant/20 px-5 py-4 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Back
                </button>
              ) : null}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="flex-1 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-surface-container-lowest shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={txLoading || !isFormValid}
                  className="flex-1 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-surface-container-lowest shadow-lg hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {txLoading ? t('submitForm.submitting') : t('submitForm.submitInvoice')}
                </button>
              )}
            </div>
          </div>

          <aside className="rounded-[24px] bg-surface-container-low p-5 border border-outline-variant/15 h-fit">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              {t('submitForm.preview.title')}
            </p>
            <div className="mt-5 space-y-4">
              <PreviewRow
                label={t('submitForm.preview.invoiceFaceValue')}
                value={`${getYieldPreview(form.amount, form.discountRate, amountInputDecimals).amountFormatted} ${selectedToken?.symbol ?? ''}`.trim()}
                token={selectedToken ?? undefined}
              />
              <PreviewRow
                label={t('submitForm.preview.freelancerPayout')}
                value={`${getYieldPreview(form.amount, form.discountRate, amountInputDecimals).payoutFormatted} ${selectedToken?.symbol ?? ''}`.trim()}
                token={selectedToken ?? undefined}
                accent
              />
              <PreviewRow
                label={t('submitForm.preview.lpYield')}
                value={`${getYieldPreview(form.amount, form.discountRate, amountInputDecimals).yieldFormatted} ${selectedToken?.symbol ?? ''}`.trim()}
                token={selectedToken ?? undefined}
              />
              <PreviewRow
                label={t('submitForm.preview.discountRate')}
                value={`${getYieldPreview(form.amount, form.discountRate, amountInputDecimals).discountRatePercent.toFixed(2)}%`}
              />
            </div>
            <div className="mt-5 rounded-2xl bg-surface-container-high px-4 py-4 text-sm text-on-surface-variant">
              {t('submitForm.previewNote', { network: NETWORK_NAME })}
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
