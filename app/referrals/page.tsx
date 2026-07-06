"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const ReferralsDashboard = dynamic(() => import("@/screens/ReferralsDashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-surface-container flex flex-col items-center justify-center text-on-surface-variant font-medium gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      Loading Referral Dashboard...
    </div>
  ),
});

export default function ReferralsPage() {
  useDocumentTitle({ pageTitle: "Referrals" });
  return (
    <Suspense fallback={null}>
      <ReferralsDashboard />
    </Suspense>
  );
}
