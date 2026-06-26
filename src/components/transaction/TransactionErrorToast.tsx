import React from "react";

export interface TransactionErrorToastProps {
  message: string;
  remediation?: string;
  technicalDetails?: string;
}

export function TransactionErrorToast({
  message,
  remediation,
  technicalDetails,
}: TransactionErrorToastProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm opacity-90">{message}</p>
      
      {remediation && (
        <p className="text-sm opacity-90 font-medium">
          {remediation}
        </p>
      )}

      {technicalDetails && (
        <details className="mt-2 group">
          <summary className="text-xs opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1 select-none">
            <span className="material-symbols-outlined text-[14px] transition-transform group-open:rotate-90">
              chevron_right
            </span>
            Technical details
          </summary>
          <div className="mt-2 p-2 bg-black/10 dark:bg-white/10 rounded overflow-x-auto text-xs whitespace-pre-wrap font-mono opacity-80">
            {technicalDetails}
          </div>
        </details>
      )}
    </div>
  );
}
