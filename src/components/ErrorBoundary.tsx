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
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    resetVersion: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  handleRetry = () => {
    this.props.onRetry?.();
    this.setState((state) => ({
      error: null,
      resetVersion: state.resetVersion + 1,
    }));
  };

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-error/20 bg-error-container/15 p-5 text-on-error-container">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">
              {this.props.fallbackMessage ?? "Something went wrong loading this section."}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="min-h-11 rounded-xl bg-error px-4 py-2 text-sm font-bold text-on-error transition-colors hover:opacity-90"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.resetVersion}>{this.props.children}</React.Fragment>;
  }
}
