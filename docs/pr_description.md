# Pull Request: Frontend Architecture Overview Documentation

## Description

This PR introduces a comprehensive frontend architecture overview document (`docs/architecture.md`) and updates the root `README.md` to reference it. This document acts as an onboarding guide for new contributors, saving repeated explanations in pull request reviews and aligning development conventions.

## Key Changes

1. **New Frontend Architecture Documentation (`docs/architecture.md`)**:
   - **System Architecture Diagram**: Added a detailed Mermaid sequence diagram representing application layers (UI, React Contexts, React Query Hooks, Stellar Utilities/SDK) and data flows (Read vs. Write lifecycles).
   - **Directory Structure & Conventions**: Described Next.js App Router folders (`app/` vs `src/`) and components placement rules.
   - **Data Flow**: Traced the complete lifecycle of reactive Read operations and interactive, wallet-signed Write transactions.
   - **Wallet Context Design**: Explained Freighter wallet integration, silent reconnects, live network verification, and role detection.
   - **React Query Strategy**: Detailed query key structuring, dynamic refetch/polling timing logic, and cache optimistic updates.
   - **Error Handling Approach**: Outlined handling of simulation failures, user wallet rejections, polling timeouts, and user feedback toast integrations.
   - **Environment Variable Conventions**: Referenced `NEXT_PUBLIC_*` client-side variables versus backend server secrets.
   - **Trade-offs & Decisions**: Clarified why TanStack React Query was chosen over SWR, and why Sonner was chosen over React Toastify.

2. **README Link Integrations (`README.md`)**:
   - Linked to `docs/architecture.md` in the **🏗 Application Architecture** intro.
   - Added `docs/architecture.md` to the **🔗 Useful Links & Documentation** list.

## Verification

- Verified all relative paths to the documentation.
- Validated markdown formatting and Mermaid diagram syntax.
- Double-checked that files build and are clean of syntax errors.
