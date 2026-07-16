# Scan Validation Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After every organizer scan, show a clear validation screen backed by server audit data including the unique ticket, event, seat, gate, exact timestamp, weekday, scanner identity, scan source, and outcome.

**Architecture:** Store immutable scan audit records in a dedicated Prisma `TicketScan` model. The scan endpoint creates a successful audit record atomically with marking the ticket used and returns the audit payload; repeated scans return the original/latest audit record. The organizer scan screen renders the returned audit in a focused validation card while preserving the existing scanner flow.

**Tech Stack:** Expo Router, React Native, TypeScript, Express, Prisma 6, SQLite, Node test runner, tsx.

---

### Task 1: Define the scan-audit contract and formatter

**Files:**
- Create: `src/organizer/scan-validation.ts`
- Create: `src/organizer/scan-validation.test.ts`
- Modify: `src/backend.ts`

- [ ] **Step 1: Write failing tests for the audit display model**

Create a pure formatter test with a fixed UTC timestamp and assert that it exposes the unique code, event, gate, scanner, source, ISO timestamp, date, weekday, and time-to-seconds fields.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run `server\\node_modules\\.bin\\tsx --test src\\organizer\\scan-validation.test.ts`.
Expected: FAIL because the formatter and audit type do not exist.

- [ ] **Step 3: Add the shared response types and formatter**

Add `BackendTicketScanAudit` to `src/backend.ts` with `id`, `scannedAt`, `gate`, `scannerId`, `scannerName`, `scannerRole`, `source`, and `outcome`. Add `scan?: BackendTicketScanAudit` to `BackendOrganizerTicketScanResult`. In `src/organizer/scan-validation.ts`, format the server timestamp with `Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })`, preserving the raw ISO timestamp for machine-readable display.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run `server\\node_modules\\.bin\\tsx --test src\\organizer\\scan-validation.test.ts`.
Expected: PASS.

### Task 2: Persist scan audit records on the server

**Files:**
- Modify: `server\\prisma\\schema.prisma`
- Modify: `server\\src\\lib\\store.ts`
- Modify: `server\\src\\routes\\organizer.ts`
- Modify: `server\\src\\lib\\store.test.ts`

- [ ] **Step 1: Write failing server tests**

Add a test that scans a valid ticket with `{ source: 'qr' }`, then asserts the result contains `scan.scannedAt`, the selected gate, scanner name/role, source, and outcome. Add a second assertion that a repeat scan returns the same ticket’s existing audit timestamp instead of creating a new successful check-in.

- [ ] **Step 2: Run the focused server test and confirm it fails**

Run `npm --prefix server exec tsx --test src/lib/store.test.ts`.
Expected: FAIL because `TicketScan` and the returned audit payload do not exist.

- [ ] **Step 3: Add the Prisma audit model**

Add `TicketScan` with `id`, `ticketId`, `scannerId`, `scannerName`, `scannerRole`, `gate`, `source`, `outcome`, and `scannedAt @default(now())`, plus relations and indexes for ticket/scanner/time. Run the project’s existing database setup path so SQLite receives the schema update.

- [ ] **Step 4: Implement audit creation and lookup**

Extend `scanOrganizerTicket` to accept `source: 'qr' | 'manual'`. On a valid ticket, create the audit record and update the ticket to `used` with the same server-side timestamp. On `already_used`, return the latest audit record for that ticket. Include the authenticated organizer’s name and role; use the selected gate as the scan location and the server timestamp as the authoritative time.

- [ ] **Step 5: Pass and validate the request source through the route**

Read `req.body.source`, default safely to `'qr'`, and pass it to the store. Keep existing status behavior for not-found and cancelled tickets.

- [ ] **Step 6: Run focused server tests and confirm they pass**

Run `npm --prefix server exec tsx --test src/lib/store.test.ts`.
Expected: PASS, including the new audit assertions.

### Task 3: Build the organizer validation screen

**Files:**
- Modify: `app\\(organizer)\\scan.tsx`
- Modify: `src\\ui\\visual-language.ts`

- [ ] **Step 1: Add the UI behavior test data contract**

Extend `src/organizer/scan-validation.test.ts` to assert that a successful QR audit formats source as `QR`, displays the scanner identity, and preserves the exact seconds from `scannedAt`.

- [ ] **Step 2: Implement the validation view**

When a scan returns, stop the camera and render a prominent validation card with outcome, holder, unique ticket code, event/date, seat/tier, gate, scanner name/role, scan source, formatted weekday/date/time, ISO timestamp, and a compact audit ID. Keep a clear “Scanner suivant” action that clears the validation view and reopens the camera after permission remains granted.

- [ ] **Step 3: Pass `source` from QR and manual scans**

Change `submitScan(code, source)` and call it with `source: 'qr'` from `handleBarcodeScanned` and `source: 'manual'` from the manual button. Keep the current feedback behavior for failures, while rendering audit details for successful and already-used results when available.

- [ ] **Step 4: Run TypeScript and UI contract tests**

Run `server\\node_modules\\.bin\\tsx --test src\\organizer\\scan-validation.test.ts src\\ui\\visual-language.test.ts` and `npx tsc --noEmit`.
Expected: PASS with no TypeScript errors.

### Task 4: Verify the end-to-end scan flow

**Files:**
- No new files.

- [ ] **Step 1: Reset the local test ticket**

Set `YT-2026-004` to `valid` through the existing organizer ticket update endpoint and clear its gate.

- [ ] **Step 2: Scan the ticket through the HTTPS phone URL**

Open `https://laptop-protary.taild6ed7d.ts.net/scan`, scan ticket `YT-2026-004`, and confirm the validation view shows the event, code, gate, current weekday/date, time to seconds, scanner identity, and QR source.

- [ ] **Step 3: Verify duplicate-scan handling**

Scan the same QR again and confirm the screen says `DÉJÀ PASSÉ` while showing the original successful audit rather than replacing it with a new timestamp.

- [ ] **Step 4: Run the project verification ladder**

Run `npx tsc --noEmit`, `npm test`, and `npm --prefix server test`.
Expected: all relevant checks pass; report any unrelated pre-existing failures separately.
