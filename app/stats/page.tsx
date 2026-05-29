"use client";

import { Suspense } from "react";
import ProtocolStatsScreen from "@/screens/ProtocolStats";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function StatsPage() {
  useDocumentTitle({ pageTitle: "Protocol Statistics | ILN" });
  return (
    <Suspense fallback={null}>
      <ProtocolStatsScreen />
    </Suspense>
  );
}
