"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
  resetVersion: number;
  copied: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    resetVersion: 0,
    copied: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error, copied: false };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  handleRetry = () => {
    this.props.onRetry?.();
    this.setState((state) => ({
      error: null,
      resetVersion: state.resetVersion + 1,
      copied: false,
    }));
  };

  handleCopy = async () => {
    const { error } = this.state;
    if (!error) return;
    const text = `${error.message}\n\n${error.stack ?? ""}`.trim();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for browsers without Clipboard API
        const el = document.createElement("textarea");
        el.value = text;
        el.style.cssText = "position:fixed;top:-9999px;left:-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // silently fail — copy is a convenience feature
    }
  };

  buildFeedbackUrl = () => {
    const { error } = this.state;
    if (!error) return "/";
    const summary = encodeURIComponent(
      `[Error Report] ${error.message.slice(0, 120)}`
    );
    return `/?feedback=true&category=Bug&description=${summary}`;
  };

  render() {
    const { error, copied } = this.state;
    const isDev = process.env.NODE_ENV === "development";

    if (error) {
      return (
        <div
          role="alert"
          className="rounded-2xl border border-error/20 bg-error-container/15 p-5 text-on-error-container space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2 min-w-0">
              <span className="material-symbols-outlined text-error shrink-0 mt-0.5">
                error
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {this.props.fallbackMessage ?? "Something went wrong loading this section."}
                </p>
                {isDev && (
                  <p className="mt-1 text-xs text-on-error-container/70 font-mono break-all">
                    {error.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={this.handleCopy}
                title="Copy error details"
                className="flex items-center gap-1 rounded-xl border border-error/30 px-3 py-2 text-xs font-medium text-on-error-container hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied" : "Copy"}
              </button>

              <a
                href={this.buildFeedbackUrl()}
                className="flex items-center gap-1 rounded-xl border border-error/30 px-3 py-2 text-xs font-medium text-on-error-container hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">bug_report</span>
                Report issue
              </a>

              <button
                type="button"
                onClick={this.handleRetry}
                className="min-h-9 rounded-xl bg-error px-4 py-2 text-sm font-bold text-on-error transition-colors hover:opacity-90"
              >
                Retry
              </button>
            </div>
          </div>

          {isDev && error.stack && (
            <pre className="overflow-x-auto rounded-xl bg-surface-container-low p-3 text-[10px] text-on-surface-variant font-mono whitespace-pre-wrap max-h-48">
              {error.stack}
            </pre>
          )}
        </div>
      );
    }

    return <React.Fragment key={this.state.resetVersion}>{this.props.children}</React.Fragment>;
  }
}
