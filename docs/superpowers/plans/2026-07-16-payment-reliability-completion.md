# Payment Reliability Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make mobile-money checkout recoverable and understandable on-device, and make missed webhook deployment failures detectable before paid checkout is enabled.

**Architecture:** Keep the provider as the payment authority and the YoTicks server as the only ticket issuer. Put country/currency/network rules and checkout timing/state decisions in tested pure modules, render those decisions in the Expo screen, preserve a failed transaction for audit while allowing a new attempt, and expose/probe a public webhook readiness route without weakening signed POST verification.

**Tech Stack:** Expo SDK 56, React Native 0.85, Expo Router 56, Express 4, Prisma 6, TypeScript, Node test runner.

---

### Task 1: Define checkout selection and recovery behavior

**Files:**
- Create: `src/mobile-money-checkout.ts`
- Create: `src/mobile-money-checkout.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests** for explicit country/currency options, country-specific networks, pending timeout after 90 seconds, terminal-state actions, and safe HTML-to-text provider instructions.
- [ ] **Step 2: Run the focused test** with `npm --prefix server exec tsx --test ./src/mobile-money-checkout.test.ts` and confirm the module-not-found failure.
- [ ] **Step 3: Implement the pure checkout model** with typed options and deterministic state output.
- [ ] **Step 4: Re-run the focused test** and require all assertions to pass.
- [ ] **Step 5: Add the test to the root test script** so the release gate always executes it.

### Task 2: Render the complete attendee checkout experience

**Files:**
- Modify: `app/checkout/[sessionId].tsx`
- Modify: `src/backend.ts`

- [ ] **Step 1: Use the tested model** to render explicit country, currency, and network radio controls; never infer payment jurisdiction from event copy.
- [ ] **Step 2: Add a visible pending timer and timeout panel** with a manual `Vérifier maintenant` action that remains available before and after timeout.
- [ ] **Step 3: Add recoverable errors** for polling/start/finalize failures and a clear `Réessayer` action for failed or cancelled transactions.
- [ ] **Step 4: Make API failures observable** by using throwing client requests for payment mutations and refreshes.
- [ ] **Step 5: Keep successful checkout terminal** with a direct route to issued tickets and no retry controls.

### Task 3: Make webhook readiness deploy-verifiable

**Files:**
- Create: `server/src/lib/webhook-readiness.ts`
- Create: `server/src/lib/webhook-readiness.test.ts`
- Create: `server/scripts/check-webhook.mjs`
- Modify: `server/src/app.ts`
- Modify: `server/src/index.ts`
- Modify: `server/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests** for production webhook configuration, HTTPS/public URL enforcement, canonical path validation, and a redacted readiness result.
- [ ] **Step 2: Run the focused test** and confirm it fails because the readiness module does not exist.
- [ ] **Step 3: Implement configuration validation** and fail production startup when paid checkout secrets or the canonical callback URL are incomplete.
- [ ] **Step 4: Add `GET` readiness responses** on both webhook paths while preserving HMAC authentication for `POST` callbacks.
- [ ] **Step 5: Add a deployment probe** that requires the configured public URL to return HTTP 200 and `{ ok: true, acceptsSignedPost: true }`.
- [ ] **Step 6: Add the readiness test and probe commands** to the release scripts.

### Task 4: Document operations and release acceptance

**Files:**
- Modify: `.env.example`
- Modify: `server/.env.example`
- Modify: `README.md`
- Modify: `docs/RELEASE_CHECKLIST.md`
- Modify: `docs/STORE_SUBMISSION.md`

- [ ] **Step 1: Document the canonical callback URL** `/api/payments/mobile-money/webhook`, secret ownership, and 200 readiness probe.
- [ ] **Step 2: Document paid-checkout activation order**: deploy server, migrate database, configure provider callback/signature secret, run the public probe, run a signed sandbox payment, then enable the Expo flag and rebuild.
- [ ] **Step 3: Add device acceptance cases** for country/currency selection, timeout/manual refresh, failure retry, app closure, webhook confirmation, and exactly-once ticket issuance.

### Task 5: Verify the production gate

- [ ] **Step 1: Run TypeScript checks** with `npm run typecheck` and require zero errors.
- [ ] **Step 2: Run lint** with `npm run lint` and require zero new errors or warnings.
- [ ] **Step 3: Run all app and server tests** with `npm test` and `npm --prefix server test`.
- [ ] **Step 4: Run Expo diagnostics** with `npx expo-doctor`.
- [ ] **Step 5: Run the production build** with `npm run build`.
- [ ] **Step 6: Probe the configured deployed callback** with `npm run payments:webhook:check`; if external deployment credentials are absent, report that single external-state blocker explicitly and do not claim the endpoint is live.
- [ ] **Step 7: Inspect adjacent reservation, notification, and ticket issuance paths** for regressions and confirm successful webhook handling remains idempotent.
