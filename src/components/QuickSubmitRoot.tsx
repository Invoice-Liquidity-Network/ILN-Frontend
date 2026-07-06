"use client";

import QuickSubmitDrawer from "@/components/QuickSubmitDrawer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function QuickSubmitRoot() {
  const { isQuickSubmitOpen, closeQuickSubmit } = useKeyboardShortcuts();
  return <QuickSubmitDrawer isOpen={isQuickSubmitOpen} onClose={closeQuickSubmit} />;
}
