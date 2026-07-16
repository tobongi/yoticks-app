# MBIYOPAY Production Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development to implement this plan task-by-task.

**Goal:** Make YoTicks’ MBIYOPAY mobile-money checkout safe for production by validating provider responses, reconciling missed webhooks, enforcing supported payment inputs, and completing the attendee payment states.

**Architecture:** Keep all provider credentials and calls on the Express server. The Expo client talks only to YoTicks. A payment remains pending until YoTicks verifies the provider transaction and atomically issues the reservation; webhooks are authenticated, validated, and idempotent, while a read-only provider transaction listing supports reconciliation.

**Tech Stack:** Expo SDK 56 / React Native 0.85, Expo Router, Express, Prisma SQLite, TypeScript, Node test runner.

---

### Task 1: Lock down provider contract and payment state behavior

**Files:**
- Modify: `server/src/lib/mbiyopay.ts`
- Create: `server/src/lib/mbiyopay-contract.test.ts`
- Create: `server/src/lib/payment-state.ts`
- Create: `server/src/lib/payment-state.test.ts`

- [ ] Add failing tests for provider statuses (`success`, `processing`, `declined`, `successful`, `pending`, `failed`, `cancelled`) and safe normalization.
- [ ] Add failing tests for amount/currency/order/transaction matching.
- [ ] Add failing tests for country/currency/network validation and documented limits.
- [ ] Implement the smallest pure helpers to satisfy those tests.

### Task 2: Add provider transaction listing and reconciliation

**Files:**
- Modify: `server/src/lib/mbiyopay.ts`
- Modify: `server/src/routes/payments.ts`
- Modify: `server/src/lib/store.ts`
- Modify: `server/prisma/schema.prisma`
- Create: `server/src/routes/payment-reconciliation.test.ts`

- [ ] Add a failing test proving a read-only provider transaction request uses `GET /api/v1/transactions` with Bearer authentication and pagination.
- [ ] Add a failing test proving a provider transaction can be matched to one YoTicks mobile-money transaction without trusting an unrelated successful transaction.
- [ ] Implement provider transaction listing and server-only reconciliation.
- [ ] Persist provider fee, charged amount, provider status, raw response, and reconciliation timestamps.
- [ ] Add an authenticated organizer/admin reconciliation route without exposing API credentials.

### Task 3: Harden webhook processing and idempotent ticket issuance

**Files:**
- Modify: `server/src/routes/payments.ts`
- Modify: `server/src/lib/store.ts`
- Modify: `server/prisma/schema.prisma`
- Modify: `server/src/routes/mbiyopay-webhook.test.ts`
- Create: `server/src/lib/payment-webhook.test.ts`

- [ ] Add failing tests for invalid signature, mismatched order, mismatched amount, mismatched currency, unknown transaction, duplicate webhook, and concurrent success handling.
- [ ] Implement payload validation before changing payment state.
- [ ] Implement monotonic state transitions and idempotent reservation issuance.
- [ ] Store the provider transaction ID and enforce uniqueness.
- [ ] Add webhook response behavior suitable for provider retries.

### Task 4: Complete provider auth modes and client states

**Files:**
- Modify: `server/src/lib/mbiyopay.ts`
- Modify: `server/src/routes/payments.ts`
- Modify: `src/backend.ts`
- Modify: `app/checkout/[sessionId].tsx`
- Create: `server/src/lib/mbiyopay-finalize.test.ts`

- [ ] Add failing tests for `redirect_url`, `auth_mode: confirm`, and unsupported `auth_mode: pin` behavior.
- [ ] Implement a safe finalize boundary if MBIYOPAY’s exact finalize contract is available; otherwise fail closed with an explicit unsupported-state response.
- [ ] Add client states for pending, confirmation instructions, redirect, failed, cancelled, expired, and successful ticket delivery.
- [ ] Ensure the client never handles provider credentials or customer PINs outside the server contract.

### Task 5: Configure and document production deployment

**Files:**
- Modify: `server/.env.example`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/STORE_SUBMISSION.md`

- [ ] Document the correct public webhook URL and required deployment secrets.
- [ ] Keep all real credentials out of tracked files and Expo public variables.
- [ ] Document the supported launch country/network scope and live-test checklist.

### Task 6: Verification

- [ ] Run targeted failing and passing tests after each task.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test` and `npm --prefix server test`.
- [ ] Run `npx expo-doctor`.
- [ ] Run `npm run build`.
- [ ] Exercise the live provider transaction-list endpoint only as a read-only credential check after secrets are configured.
- [ ] Confirm the deployed webhook URL returns a valid YoTicks response and accepts only valid provider signatures.
