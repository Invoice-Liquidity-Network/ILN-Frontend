# Changelog

## [unreleased]


### ⚙️ Chores

- Merge upstream main and resolve conflicts

- Add sonner for standardized toast notifications


### ⚡ Performance

- Implement route-level code splitting for chart and PDF libraries

- Deduplicate and batch Horizon API calls across the app

- Implement route-level code splitting for chart and PDF libraries


### 🐛 Bug Fixes

- Conflict

- Conflict

- Add token-aware amount formatting

- Resolved issues #55 #47 #54 #24

- Repair profile page and embed activity heatmap

- *(notifications)* Return empty list when external API is unavailable

- *(notifications)* Avoid refetch loop when merging API notifications

- Removed task.md


### 💼 Other

- Build a JavaScript/TypeScript SDK for the ILN contract

- Add skeleton loading states to the invoice table


### 🚀 Features

- Initialize frontend with Next.js, TypeScript, and Tailwind CSS

- Add full dark mode support with system preference detection

- Add transaction toast notifications with pending/success/error states

- Add liquidity provider dashboard

- Add Horizon event indexer with SQLite storage and REST API

- Add persistent Freighter wallet session with global context

- Add leaderboard page with API route and indexer integration

- Add in-app notification bell and notification centre UI (pending wallet integration)

- Add freelancer invoice submission form with Freighter integration

- Add USDC balance display and token approval flow before funding

- Add token selector with USDC and EURC support

- Add native XLM support via Stellar Asset Contract

- Add public shareable invoice status page with QR code

- Added proctocol analytics overview dashbaord

- Add React Testing library component tests for forms and wallet

- Add public shareable invoice status page with QR code

- Added proctocol analytics overview dashbaord

- Add public shareable invoice status page with QR code

- Add risk indicator badges to LP invoice discovery table

- Add LP invoice watchlist with localStorage persistence

- Add guided onboarding flow for freelancer, LP, and payer roles

- Add chronological activity feed to invoice detail page

- Add copy payer link button and dedicated payer settlement page

- Add column visibility and reorder customisation to invoice tables

- Add invoice amount distribution histogram to analytics

- Add animated voting progress bar for governance proposals

- Add protocol network status banner with testnet/mainnet/maintenance states

- Add LP performance analytics page with charts and payer table

- Add live due date countdown to funded invoices

- Add Submit similar invoice with pre-filled form

- Frontend: Add invoice search and advanced filtering

- Add floating action button for quick invoice submission (#122)

- Add Cmd+K command palette for power user navigation

- Implement generic DataTable component with all features

- Add CSV/JSON analytics data export with date range filter (#66)

- Redesign USDC approval flow with clear step indicator modal

- Add real-time invoice polling with optimistic UI updates

- Add animated number counters to analytics metric cards

- Add side-by-side invoice comparison view for LPs

- Add LP funding history area chart to analytics page

- Add contextual help tooltips to invoice submission form fields

- Add timeline view as alternative to table on freelancer dashboard

- Add copy payer link button and dedicated payer settlement page Closes #175

- Add keyboard navigation and shortcuts to invoice tables (Closes #104)

- Add multi-select and bulk actions to freelancer invoice table

- Add illustrated empty states to all dashboard views (#100)

- Add freelancer earnings and payer reliability analytics

- Add per-token yield analytics to LP portfolio

- Notification settings UI, fee breakdown tooltips, sound notifications, page tours

- *(frontend)* Add shortcuts modal and top funders widget

- Frontend build fix

- Frontend build fix

- Integrate I18nProvider into RootLayout for internationalization support

- Add TokenSelector component with balance display and token selection functionality

- Add payer inbox and governance controls

- Improve governance proposals list

- Add token allowlist governance panel

- Add dispute UI, expiry countdown fix, LP marketplace

- Add reputation history profile chart

- Implement reputation filtering, batch submission, LP risk management, and governance voting power

- Add wallet roles, faucet, invoice stepper, and cancellation UI

- Show specific fee-on-transfer rejection error in token addition UI

- Add supported token information page with trustline add action

- Build invoice token conversion UI for pending invoices

- Add live rate ticker for Dutch auction invoices on marketplace

- Multi-provider wallet connect, copy/install UX & full disconnect cleanup

- Invoice PDF export, USD amount preview & deep-link sharing

- *(components)* Add WalletAddress with Stellar Federation resolution (#5)

- Implement reputation decay indicator

- Implement payer one-click invoice settlement with approval flow

- Add proactive token mismatch warning in LP funding modal

- Add reputation-gated marketplace dimming for LP risk preferences

- Add sonner toaster configuration for ILN notifications

- Migrate ToastContext to sonner with info and warning types

- Add Horizon base URL helpers for contract streaming

- Parse invoice contract events and invoice cache updates

- Add Horizon transaction stream with exponential reconnect

- Implement useContractEvents hook for live invoice updates

- Integrate contract event stream and polling fallback in layout

- Add activity heatmap data aggregation utilities

- Add GitHub-style ActivityHeatmap SVG component

- *(notifications)* Extend context with categories and wallet-scoped storage

- *(notifications)* Enhance drawer with icons, links, and time ago

- *(notifications)* Poll invoice, governance, and reputation events

- *(notifications)* Add bell to navbar and global event poller

- Implement partial payment functionality in PayInvoicePage and add PartialPaymentModal component

- Build public protocol statistics overview page

- Complete invoice UX across balances, submission, detail & dashboard

- Add event log viewer to invoice detail page

- *(query)* Centralise React Query keys and cache timings (#154)

- *(home)* Add live invoice count ticker to hero (#133)

- *(governance)* Announce protocol parameter changes via dismissible banners (#153)

- *(ui)* Add skeleton loading states for invoice list and profile (#155)

- Build admin protocol health dashboard with action shortcuts, add Playwright responsive layout tests for mobile viewports, add error boundaries and tests for contract failure scenarios,set up MSW for realistic API mocking in Jest and Playwright

- Enhance wallet connection handling and user experience

- Add LP onboarding flow for first-time funders

- Build governance proposal detail page with voting

- Add proposal execution UI with timelock countdown

- Build LP insurance pool opt-in and claim UI

- Display invoice NFT metadata and transfer history on detail page

- Build referral code UI and on-chain attribution

- Map all contract error codes to user-friendly messages

- Create reusable PageHeader component for consistent page titles

- Add public roadmap page with phase-based feature timeline

- Build LP whitelist management UI for private invoice markets

- Add What's New changelog modal for returning users

- Add testnet feedback widget with API submission


### 🚜 Refactor

- Reorganize project structure by moving core hooks and utilities into a structured src directory

- Restructure notification settings, add security policy, and update contract test snapshots

- Route command palette settings actions to in-app pages

- Centralize heatmap colour scale constants


### 🧪 Testing

- Add unit tests for useBalances and useTransaction hooks

- Cover toast auto-dismiss and error persistence behaviour

- Add contract event parsing and stream reconnect coverage

- Add activity heatmap and profile page coverage

- *(notifications)* Cover context, drawer, helpers, and event polling

- Add accessibility, visual regression, contract and performance CI suite

- Resolve accessibility, responsive mobile, performance budget and contract integration test suite issues

- Set up Chromatic visual regression testing for UI components

