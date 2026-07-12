'use client';

import { type ReactNode } from 'react';
import { KeyboardShortcutsProvider } from '@/hooks/useKeyboardShortcuts';

export default function KeyboardShortcutsRoot({ children }: { children: ReactNode }) {
  return <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>;
}
