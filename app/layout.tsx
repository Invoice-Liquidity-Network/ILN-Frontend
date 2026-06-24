import type { Metadata } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import I18nProvider from "@/components/I18nProvider";
import { ToastProvider } from "@/context/ToastContext";
import { WalletProvider } from "@/context/WalletContext";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationEventPoller from "@/components/NotificationEventPoller";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import FABProvider from "@/components/FABProvider";
import FeedbackWidget from "@/components/FeedbackWidget";
import CommandPalette from "@/components/CommandPalette";
import OfflineBanner from "@/components/OfflineBanner";
import NetworkMismatchBanner from "@/components/NetworkMismatchBanner";
import ContractEventSync from "@/components/ContractEventSync";
import WhatsNewModal from "@/components/modals/WhatsNewModal";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "ILN | Invoice Liquidity Network",
  description: "An open-source invoice factoring protocol on Stellar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3d627f" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f1117" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ILN" />
        <meta
          name="description"
          content="Decentralized invoice factoring on Stellar"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3d627f" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, viewport-fit=cover"
        />
      </head>
      <body className="antialiased bg-background text-foreground transition-colors duration-300 selection:bg-primary-container selection:text-on-primary-container">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium"
        >
          Skip to main content
        </a>
        <I18nProvider>
          <Providers>
            <ToastProvider>
              <ContractEventSync />
              <WalletProvider>
                <NotificationProvider>
                  <OfflineBanner />
                  <NetworkMismatchBanner />
                  <FABProvider />
                  <div id="main-content" className="min-h-screen flex flex-col">
                    <div className="flex-1">
                      <Suspense fallback={null}>{children}</Suspense>
                    </div>
                  </div>
                  <Suspense fallback={null}>
                    <OnboardingFlow />
                  </Suspense>
                  <Suspense fallback={null}>
                    <WhatsNewModal />
                  </Suspense>
                  <Suspense fallback={null}>
                    <CommandPalette />
                  </Suspense>
                  <FeedbackWidget />
                </NotificationProvider>
              </WalletProvider>
            </ToastProvider>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
