export interface WhatsNewItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  version: string;
}

export const WHATS_NEW: WhatsNewItem[] = [
  {
    id: 'lp-whitelist',
    icon: '🛡️',
    title: 'LP Whitelist Management',
    description: 'Manage approved liquidity providers directly from invoice pages.',
    version: '1.5.0',
  },
  {
    id: 'governance',
    icon: '🗳️',
    title: 'Governance Dashboard',
    description: 'Browse and participate in protocol governance proposals.',
    version: '1.5.0',
  },
  {
    id: 'faster-processing',
    icon: '⚡',
    title: 'Faster Transaction Processing',
    description: 'Improved submission and indexing performance.',
    version: '1.5.0',
  },
];
