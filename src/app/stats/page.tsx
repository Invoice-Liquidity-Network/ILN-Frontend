// The routed page lives in `app/stats/page.tsx` (the root `app/` directory
// takes precedence over `src/app/`). This module re-exports it so the two
// copies cannot drift apart again.
export { default } from '@/app/stats/page';
